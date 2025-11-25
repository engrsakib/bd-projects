import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Types } from "mongoose";
import { UniqueBarcodeService } from "./barcode.service";

class Controller extends BaseController {
  crateBarcodeForStock = this.catchAsync(
    async (req: Request, res: Response) => {
      const { sku, product_count } = req.body;
      const user = req.user;
      const result = await UniqueBarcodeService.crateBarcodeForStock(
        sku,
        product_count,
        user
      );
      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Barcodes created successfully",
        data: result,
      });
    }
  );
}

export const CartController = new Controller();
