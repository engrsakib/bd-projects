import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import HttpStatus from "http-status";
import { CourierService } from "./courier.service";

class Controller extends BaseController {
  transferToCourier = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note, marchant } = req.body;
    if (!id || !marchant) {
      return this.sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: "Order ID and Marchant are required",
      });
    }

    const result = await CourierService.transferToCourier(id, note, marchant);
    return this.sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Order transferred to courier successfully",
      data: result,
    });
  });

  scanToShipping = this.catchAsync(async (req: Request, res: Response) => {
    const { note, marchant, order_id } = req.body;
    if (!order_id || !marchant) {
      return this.sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: "Order ID and Marchant are required",
      });
    }

    console.log("scanToShipping controller", { order_id, note, marchant });

    const result = await CourierService.scanToShipping(
      order_id,
      note,
      marchant
    );
    return this.sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Order transferred to courier successfully",
      data: result,
    });
  });

  statusByTrackingCode = this.catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await CourierService.statusByTrackingCode(id);
      return this.sendResponse(res, {
        statusCode: HttpStatus.OK,
        success: true,
        message: "Order status found successfully",
        data: result,
      });
    }
  );
}

export const CourierController = new Controller();
