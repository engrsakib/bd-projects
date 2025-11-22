import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { DefaultsPurchaseService } from "./defult-purchase.service";

class Controller extends BaseController {
  createPurchase = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.body) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Request body is required",
      });
    }

    if (!req.body.product || !req.body.unit_cost || !req.body.variant) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Product, unit_cost, and variant are required",
      });
    }

    const data = await DefaultsPurchaseService.createPurchase(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Default purchase created successfully",
      data,
    });
  });
}

export const DefaultsPurchaseController = new Controller();
