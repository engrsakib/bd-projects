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
    admin_note: string,
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
        admin_note:
          admin_note ||
          `barcode initialized for stock by ${(user as any).name || "System"} and not assigned yet`,
        system_message: "Barcode created for stock initialization",
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
          updated_logs: [update_by],
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

  async getBarcodesBySku(
    sku: string,
    options?: { page?: number; limit?: number; is_used_barcode?: boolean }
  ): Promise<{
    data: IBarcode[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.max(1, options?.limit ?? 10);

    // Build filter: always filter by sku, add is_used_barcode only if provided
    const filter: Record<string, any> = { sku };
    if (options && typeof options.is_used_barcode !== "undefined") {
      filter.is_used_barcode = options.is_used_barcode;
    }

    // Run count + find in parallel for performance
    const [total, docs] = await Promise.all([
      BarcodeModel.countDocuments(filter),
      BarcodeModel.find(filter)
        .sort({ createdAt: -1 }) // optional: adjust sorting as needed
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(), // return plain objects (faster) — remove if you want mongoose docs
    ]);

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      data: docs as IBarcode[],
      meta: { total, page, limit, totalPages },
    };
  }
}

export const UniqueBarcodeService = new Service();
