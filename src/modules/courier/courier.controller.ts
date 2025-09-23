import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import HttpStatus from "http-status";
import { CourierService } from "./courier.service";

class Controller extends BaseController {
  transferToCourier = this.catchAsync(async (req: Request, res: Response) => {
    const { order_id } = req.params;
    const { note } = req.body;
    if (!order_id) {
      return this.sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: "Order ID is required",
      });
    }

    const result = await CourierService.transferToCourier(order_id, {
      note: note || "Order transferred to courier",
    });
    return this.sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Order transferred to courier successfully",
      data: result,
    });
  });
}

export const CourierController = new Controller();
