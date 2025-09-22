import ApiError from "../../middlewares/error";
import axios from "axios";

export type TCourierPayload = {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
};

class Middleware {
  transfer_single_order = async (data: TCourierPayload) => {
    try {
      const apiKey = process.env.courier_api_key;
      const secretKey = process.env.courier_secret_key;

      if (!apiKey || !secretKey) {
        throw new ApiError(400, "Courier env key is missing");
      }

      const res = await axios.post(
        "https://portal.packzy.com/api/v1/create_order",
        data,
        {
          headers: {
            "Api-Key": apiKey,
            "Secret-Key": secretKey,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (err: any) {
      console.error(err);
      throw new ApiError(
        400,
        "Transfer to courier failed! Got error: " + err.message
      );
    }
  };

  status_by_tracking_code = async (code: string) => {
    try {
      const apiKey = process.env.courier_api_key;
      const secretKey = process.env.courier_secret_key;

      if (!apiKey || !secretKey) {
        throw new ApiError(400, "Courier env key is missing");
      }

      const res = await axios.get(
        `https://portal.packzy.com/api/v1/status_by_trackingcode/${code}`,
        {
          headers: {
            "Api-Key": apiKey,
            "Secret-Key": secretKey,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (err: any) {
      console.error(err);
      throw new ApiError(
        400,
        "Failed to get status by tracking code: " + err.message
      );
    }
  };
}

export const CourierMiddleware = new Middleware();
