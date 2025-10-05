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
    const { note, marchant } = req.body;
    const { orderId } = req.params;
    if (!orderId || !marchant) {
      return this.sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: "Order ID and Marchant are required",
      });
    }

    console.log("scanToShipping controller", { orderId, note, marchant });

    const result = await CourierService.scanToShipping(orderId, note, marchant);
    return this.sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Order transferred to courier successfully",
      data: result,
    });
  });

  scanToReturn = this.catchAsync(async (req: Request, res: Response) => {
    const { note, marchant } = req.body;
    const { orderId } = req.params;
    if (!orderId || !marchant) {
      return this.sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: "Order ID and Marchant are required",
      });
    }

    console.log("scanToReturn controller", { orderId, note, marchant });

    const result = await CourierService.scanToReturn(orderId);
    return this.sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Order returned successfully",
      data: result,
    });
  });

  handlePendingReturns = this.catchAsync(
    async (req: Request, res: Response) => {
      const { orderId, productIds } = req.body;
      if (!orderId || !productIds || !Array.isArray(productIds)) {
        return this.sendResponse(res, {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: "Order ID and Product IDs are required",
        });
      }

      const result = await CourierService.handlePendingReturns(
        orderId,
        productIds
      );
      return this.sendResponse(res, {
        statusCode: HttpStatus.OK,
        success: true,
        message: "Pending returns handled successfully",
        data: result,
      });
    }
  );

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
