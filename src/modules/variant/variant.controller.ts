import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { VariantService } from "./variant.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import { Types } from "mongoose";

class Controller extends BaseController {
  createVariant = this.catchAsync(async (req: Request, res: Response) => {
    const result = await VariantService.createVariant(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Variant created successfully",
      data: result,
    });
  });

  updateOne = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const result = await VariantService.updateOne(id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variant updated successfully",
      data: result,
    });
  });

  updateMany = this.catchAsync(async (req: Request, res: Response) => {
    const result = await VariantService.updateMany(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variants updated successfully",
      data: result,
    });
  });
}

export const VariantController = new Controller();
