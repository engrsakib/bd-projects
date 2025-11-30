import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { BkashService } from "./bkash.service";
import { envConfig } from "@/config/index";

class Controller extends BaseController {
  createPayment = this.catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await BkashService.createPayment(payload);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Create payment successfully",
      data,
    });
  });
  executePayment = this.catchAsync(async (req: Request, res: Response) => {
    const paymentID = req.query.paymentID as string;
    const status = req.query.status as string;
    const frontendUrl =
      envConfig.app.env === "development"
        ? envConfig.clients.public_dev
        : envConfig.clients.public_prod;

    if (status == "success") {
      const data = await BkashService.executePayment(paymentID);

      if (data.status === "success") {
        res.redirect(`${frontendUrl}/payment/success?payment_id=${paymentID}`);
      } else {
        res.redirect(`${frontendUrl}/payment/failed?payment_id=${paymentID}`);
      }
    } else {
      res.redirect(`${frontendUrl}/payment/failed?payment_id=${paymentID}`);
    }
  });

  refundPayment = this.catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await BkashService.refundPayment(payload);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Refund processed successfully",
      data,
    });
  });
}

export const BkashController = new Controller();
