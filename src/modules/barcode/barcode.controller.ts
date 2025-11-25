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

  getBarcodesBySku = this.catchAsync(async (req: Request, res: Response) => {
    const { sku } = req.params;
    if (!sku) {
      this.sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "SKU is required",
      });
      return;
    }

    // read optional query params
    const barcode =
      typeof req.query.barcode === "string" ? req.query.barcode : "";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.max(
      1,
      parseInt(String(req.query.limit ?? "10"), 10) || 10
    );

    let is_used_barcode: boolean | undefined;
    const rawVal = req.query.is_used_barcode;

    if (typeof rawVal !== "undefined") {
      const first = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      const trimmed = String(first).trim();

      if (trimmed === "") {
        is_used_barcode = undefined;
      } else {
        const lower = trimmed.toLowerCase();
        is_used_barcode = lower === "true" || lower === "1" ? true : false;
      }
    }
    const result = await UniqueBarcodeService.getBarcodesBySku(sku, barcode, {
      page,
      limit,
      is_used_barcode,
    });

    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Barcodes retrieved successfully",
      data: result,
    });
  });
}

export const UniqueBarcodeController = new Controller();
