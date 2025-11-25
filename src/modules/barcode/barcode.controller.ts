import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Types } from "mongoose";
import { UniqueBarcodeService } from "./barcode.service";

class Controller extends BaseController {
  crateBarcodeForStock = this.catchAsync(
    async (req: Request, res: Response) => {
      const { sku, product_count, admin_note } = req.body;

      if (!sku || !product_count) {
        this.sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "SKU and product_count are required",
        });
        return;
      }
      const user = req.user;
      //   console.log(user, "user data update")
      const result = await UniqueBarcodeService.crateBarcodeForStock(
        sku,
        product_count,
        admin_note,
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

export const UniqueBarcodeController = new Controller();
