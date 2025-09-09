import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { BkashService } from "./bkash.service";
import { envConfig } from "@/config/index";

class Controller extends BaseController {
  executePayment = this.catchAsync(async (req: Request, res: Response) => {
    const paymentID = req.query.paymentID as string;
    const data = await BkashService.executePayment(paymentID);
    const frontendUrl =
      envConfig.app.env === "development"
        ? envConfig.clients.public_dev
        : envConfig.clients.public_prod;

    if (data.transactionStatus === "Completed") {
      res.redirect(`${frontendUrl}/payment/success?orderId=${data.order_id}`);
    } else {
      res.redirect(`${frontendUrl}/payment/fail?orderId=${data.order_id}`);
    }
  });
}

export const BkashController = new Controller();
