import { Request, Response } from "express";
import { SupplierService } from "./supplier.service";

import BaseController from "@/shared/baseController";

class Controller extends BaseController {
  createSupplier = this.catchAsync(async (req: Request, res: Response) => {
    const data = await SupplierService.createSupplier(req.body);

    return this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Supplier created successfully",
      data: data,
    });
  });

  getAllSupplier = this.catchAsync(async (req: Request, res: Response) => {
    const data = await SupplierService.getAllSuppliers();
    return this.sendResponse(res, {
      statusCode: 200,
      success: true,
      data: data,
      message: "All suppliers fetched successfully",
    });
  });
}

export const SupplierController = new Controller();
