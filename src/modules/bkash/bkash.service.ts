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

class Service {
  // --- bKash URLs ---
  private readonly grant_token_url = envConfig.bkash.urls.grant_token_url;
  private readonly create_payment_url = envConfig.bkash.urls.create_payment_url;
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

  // --- Session Token (expires hourly) ---
  private id_token: string | null = null;
  private token_expiry: number | null = null;

  // Internal helper to ensure token is valid or refresh it
  private async ensureToken() {
    const now = Date.now();
    console.log("grantToken", this.id_token);
    if (!this.id_token || !this.token_expiry || now >= this.token_expiry) {
      await this.grantToken();
    }
  }

  //  Grant Token
  public async grantToken() {
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

      if (!data?.id_token) {
        throw new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          "Failed to get bKash grant token"
        );
      }

      this.id_token = data.id_token;
      // bKash sandbox tokens valid for 3600 seconds (1h)
      this.token_expiry =
        Date.now() + (data.expires_in ? data.expires_in * 1000 : 3500 * 1000);

      console.log("bKash grant token received ✅");
      return data;
    } catch (error: any) {
      console.log("Bkash Grant Token Error", error);
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `bKash grantToken failed: ${error?.message}`
      );
    }
  }

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

      console.log(payload, "bKash Create Payment Payload");

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

      console.log("Bkash payment response", data);

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

  //Execute Payment
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

      const { data } = await axios.post(
        this.execute_payment_url,
        payload,
        config
      );

      console.log("bkash execute data", data);

      // 4. Validate response
      if (!data || !data.trxID || !data.transactionStatus) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Invalid bKash execute payment response"
        );
      }

      const transaction_id: string = data.trxID;
      const bkashStatus: string = data.transactionStatus;
      const mappedStatus: PAYMENT_STATUS = this.mapBkashStatus(bkashStatus);

      await OrderService.updatePaymentStatus(
        paymentID,
        transaction_id,
        mappedStatus
      );

      console.log("Bkash payment callback execution successful", data);
      // Map to "success" or "failed" for the caller
      const resultStatus: "success" | "failed" =
        mappedStatus === PAYMENT_STATUS.PAID ? "success" : "failed";

      console.log("Bkash payment callback execution successful", {
        paymentID,
        transaction_id,
        bkashStatus,
        resultStatus,
      });

      return { status: resultStatus };
    } catch (error: any) {
      console.log(`Failed to execute bKash payment: ${error.message}`, error);
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `Failed to execute bKash payment: ${error.message}`
      );
    }
  }

  //Refund Payment
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

      if (!data?.transactionStatus) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Failed to refund bKash payment"
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
