import { envConfig } from "@/config/index";
import { HttpStatusCode } from "@/lib/httpStatus";
import ApiError from "@/middlewares/error";
import axios, { AxiosRequestConfig } from "axios";
import {
  IBkashCreatePaymentParams,
  IBkashRefundPayment,
} from "./bkash.interface";
import { OrderService } from "../order/order.service";
import { PAYMENT_STATUS } from "../order/order.enums";
import redisClient from "@/utils/redis";

class Service {
  // --- bKash URLs ---
  private readonly grant_token_url = envConfig.bkash.urls.grant_token_url;
  private readonly refresh_token_url = envConfig.bkash.urls.refresh_token_url;
  private readonly create_payment_url = envConfig.bkash.urls.create_payment_url;
  private readonly query_payment_url = envConfig.bkash.urls.query_payment_url;
  private readonly execute_payment_url =
    envConfig.bkash.urls.execute_payment_url;
  private readonly refund_transaction_url =
    envConfig.bkash.urls.refund_transaction_url;
  private readonly callback_url = `${envConfig.clients.server_base_url}/payments/bkash/execute-callback`;

  // --- bKash Credentials ---
  private readonly username = envConfig.bkash.credentials.username;
  private readonly password = envConfig.bkash.credentials.password;
  private readonly app_key = envConfig.bkash.credentials.app_key;
  private readonly app_secret = envConfig.bkash.credentials.app_secret;

  // --- Redis Keys ---
  private readonly redisIdTokenKey = "bkash:id_token";
  private readonly redisRefreshTokenKey = "bkash:refresh_token";
  private readonly redisIdTokenExpiryKey = "bkash:id_token_expiry";

  // --- In-memory cache (optional layer) ---
  private id_token: string | null = null;
  private token_expiry: number | null = null;

  // ==========================
  // 🔐 INTERNAL TOKEN HELPERS
  // ==========================

  /**
   * Call bKash grant token API and store in Redis (+ memory).
   */
  private async getNewGrantToken(): Promise<string> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: this.username,
          password: this.password,
        },
      };

      const body = { app_key: this.app_key, app_secret: this.app_secret };

      const { data } = await axios.post(this.grant_token_url, body, config);

      if (!data || !data.id_token || !data.expires_in || !data.refresh_token) {
        throw new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          "Invalid bKash grant token response"
        );
      }

      const expiryTime =
        Date.now() + (data.expires_in ? data.expires_in * 1000 : 3500 * 1000);
      const ttlMs = expiryTime - Date.now();

      // Save in Redis
      await redisClient.set(this.redisIdTokenKey, data.id_token, "PX", ttlMs);
      await redisClient.set(this.redisRefreshTokenKey, data.refresh_token);
      await redisClient.set(this.redisIdTokenExpiryKey, expiryTime.toString());

      // Also update in-memory cache
      this.id_token = data.id_token;
      this.token_expiry = expiryTime;

      console.log("bKash: New grant token acquired ✅");
      return data.id_token;
    } catch (error: any) {
      console.error("Bkash Grant Token Error", error?.message || error);
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `bKash grantToken failed: ${error?.message || "Unknown error"}`
      );
    }
  }

  /**
   * Call bKash refresh token API using cached refresh_token.
   * Falls back to getNewGrantToken() if anything is wrong.
   */
  private async refreshBkashToken(): Promise<string> {
    try {
      const refreshToken = (await redisClient.get(
        this.redisRefreshTokenKey
      )) as string | null;

      if (!refreshToken) {
        console.log(
          "bKash: No refresh token found in Redis. Requesting new grant token..."
        );
        return await this.getNewGrantToken();
      }

      const config: AxiosRequestConfig = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: this.username,
          password: this.password,
        },
      };

      const body = {
        refresh_token: refreshToken,
        app_key: this.app_key,
        app_secret: this.app_secret,
      };

      const { data } = await axios.post(this.refresh_token_url, body, config);

      if (!data || !data.id_token || !data.expires_in || !data.refresh_token) {
        console.log(
          "bKash: Invalid refresh response. Falling back to new grant token..."
        );
        return await this.getNewGrantToken();
      }

      const expiryTime =
        Date.now() + (data.expires_in ? data.expires_in * 1000 : 3500 * 1000);
      const ttlMs = expiryTime - Date.now();

      await redisClient.set(this.redisIdTokenKey, data.id_token, "PX", ttlMs);
      await redisClient.set(this.redisRefreshTokenKey, data.refresh_token);
      await redisClient.set(this.redisIdTokenExpiryKey, expiryTime.toString());

      this.id_token = data.id_token;
      this.token_expiry = expiryTime;

      console.log("bKash: Token refreshed ✅");
      return data.id_token;
    } catch (error: any) {
      console.error(
        "Bkash Token Refresh Error",
        error?.message || error?.toString?.() || error
      );
      console.log(
        "bKash: Refresh failed. Requesting a new grant token instead..."
      );
      return await this.getNewGrantToken();
    }
  }

  /**
   * Ensure there's a valid token in memory/redis.
   * - Tries Redis first
   * - If expired → refresh
   * - If anything fails → get new grant token
   */
  private async ensureToken() {
    const now = Date.now();

    // Try to hydrate from Redis if in-memory empty
    if (!this.id_token || !this.token_expiry) {
      const [cachedToken, expiryStr] = await redisClient.mget(
        this.redisIdTokenKey,
        this.redisIdTokenExpiryKey
      );

      if (cachedToken && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (!isNaN(expiry) && now < expiry) {
          this.id_token = cachedToken;
          this.token_expiry = expiry;
          console.log("bKash: Using cached token from Redis ✅");
        }
      }
    }

    // If still no token or no expiry → call grant token
    if (!this.id_token || !this.token_expiry) {
      console.log(
        "bKash: No valid token/expiry found. Requesting new grant token..."
      );
      await this.getNewGrantToken();
      return;
    }

    // If expired → refresh
    if (now >= this.token_expiry) {
      console.log("bKash: Token expired. Refreshing...");
      await this.refreshBkashToken();
    }
  }

  public async grantToken() {
    return this.getNewGrantToken();
  }

  // ==========================
  // PAYMENT FLOWS
  // ==========================

  //  Create Payment
  public async createPayment(
    params: IBkashCreatePaymentParams
  ): Promise<{ payment_id: string; payment_url: string }> {
    try {
      await this.ensureToken();

      const payload = {
        mode: "0011",
        payerReference: " ",
        callbackURL: this.callback_url,
        amount: params.payable_amount.toFixed(),
        currency: "BDT",
        intent: params.intent || "sale",
        merchantInvoiceNumber: params.invoice_number,
      };

      // console.log(payload, "bKash Create Payment Payload");

      const config: AxiosRequestConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: this.id_token!,
          Accept: "application/json",
          "X-APP-key": this.app_key,
        },
      };

      const { data } = await axios.post(
        this.create_payment_url,
        payload,
        config
      );

      // console.log("Bkash payment response", data);

      if (!data?.paymentID) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Failed to place order or payment initiate. Please try again"
        );
      }

      return { payment_id: data.paymentID, payment_url: data.bkashURL };
    } catch (error: any) {
      console.log("Create payment failed", error);
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `bKash createPayment failed: ${error.message}`
      );
    }
  }

  // Execute Payment
  public async executePayment(
    paymentID: string
  ): Promise<{ status: "success" | "failed" }> {
    try {
      await this.ensureToken();

      const payload = { paymentID };

      const config: AxiosRequestConfig = {
        headers: {
          Authorization: this.id_token!,
          "X-APP-Key": this.app_key,
          "Content-Type": "application/json",
        },
      };

      const { data: executeResponse } = await axios.post(
        this.execute_payment_url,
        payload,
        config
      );

      // console.log("bkash execute data", executeResponse);
      const data = { ...executeResponse };

      if (
        data &&
        data?.statusCode &&
        data.statusCode !== "0000" &&
        data?.transactionStatus == "completed"
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Invalid bKash execute payment response"
        );
      }

      if (
        data?.transactionStatus !== "Completed" &&
        data?.statusCode !== "0000"
      ) {
        const { data: queryResponse } = await axios.post(
          this.query_payment_url,
          payload,
          config
        );
        if (
          queryResponse?.transactionStatus !== "Completed" ||
          queryResponse?.statusCode !== "0000"
        ) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Invalid bKash execute payment response"
          );
        }
        if (
          queryResponse?.transactionStatus === "Completed" &&
          queryResponse?.statusCode == "0000"
        ) {
          // proceed
          data.transactionStatus = queryResponse.transactionStatus;
          data.trxID = queryResponse.trxID;
        }
      }

      const transaction_id: string = data.trxID;
      const bkashStatus: string = data.transactionStatus;
      const mappedStatus: PAYMENT_STATUS = this.mapBkashStatus(bkashStatus);

      await OrderService.updatePaymentStatus(
        paymentID,
        transaction_id,
        mappedStatus
      );

      const resultStatus: "success" | "failed" =
        mappedStatus === PAYMENT_STATUS.PAID ? "success" : "failed";

      // console.log("Bkash payment callback execution successful", {
      //   paymentID,
      //   transaction_id,
      //   bkashStatus,
      //   resultStatus,
      // });

      return { status: resultStatus };
    } catch (error: any) {
      console.log(`Failed to execute bKash payment: ${error.message}`, error);
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `Failed to execute bKash payment: ${error.message}`
      );
    }
  }

  // Refund Payment
  public async refundPayment(params: IBkashRefundPayment) {
    try {
      await this.ensureToken();

      const payload = {
        paymentID: params.paymentID,
        trxID: params.trxID,
        amount: params.amount,
        sku: params.sku,
        reason: params.reason || "Customer Request",
      };

      const config: AxiosRequestConfig = {
        headers: {
          Authorization: this.id_token!,
          "X-APP-Key": this.app_key,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        this.refund_transaction_url,
        payload,
        config
      );
      // console.log("refund data", data);

      if (!data?.transactionStatus) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          data?.statusMessage || "Failed to refund bKash payment"
        );
      }

      return data;
    } catch (error: any) {
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `Failed to refund bKash payment. Error: ${error?.message}`
      );
    }
  }

  private mapBkashStatus(bkashStatus: string): PAYMENT_STATUS {
    switch (bkashStatus) {
      case "Completed":
        return PAYMENT_STATUS.PAID;
      case "Failed":
      case "Cancelled":
      case "Timeout":
        return PAYMENT_STATUS.FAILED;
      default:
        return PAYMENT_STATUS.PENDING;
    }
  }
}

export const BkashService = new Service();
