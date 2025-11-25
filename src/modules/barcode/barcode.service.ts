import mongoose from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IBarcode } from "./barcode.interface";
import { VariantModel } from "../variant/variant.model";
import { BarcodeService } from "@/lib/barcode";
import { BarcodeModel } from "./barcode.model";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";

class Service {
  async crateBarcodeForStock(
    sku: string,
    product_count: number,
    user: unknown
  ): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const variant = await VariantModel.findOne({ sku }).session(session);
      if (!variant) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          "Variant not found for the provided SKU"
        );
      }

      const update_by = {
        name: (user as any).name || "System",
        role: (user as any).role || "System",
        date: new Date(),
      };

      const doc: Partial<IBarcode>[] = [];
      for (let i = 0; i < product_count; i++) {
        const barcodeValue = BarcodeService.generateEAN13();
        doc.push({
          barcode: barcodeValue,
          sku: sku,
          variant: variant._id,
          product: variant.product,
          status: productBarcodeStatus.QC_PENDING,
          conditions: productBarcodeCondition.NEW,
          is_used_barcode: false,
          updated_by: [update_by],
        });
      }
      await BarcodeModel.insertMany(doc, { session });
      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to create barcodes"
      );
    } finally {
      session.endSession();
    }
  }
}

export const UniqueBarcodeService = new Service();
