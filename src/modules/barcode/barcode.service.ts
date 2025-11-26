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

  async updateBarcodeStatus(
    barcode: string,
    status: productBarcodeStatus,
    conditions: productBarcodeCondition,
    updated_by: { name: string; role: string; reason?: string; date: Date },
    status_change_notes?: string
  ): Promise<IBarcode | null> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Find the document within the session
      const barcodeDoc = await BarcodeModel.findOne({ barcode }).session(
        session
      );
      if (!barcodeDoc) {
        // abort and throw error if not found
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Barcode not found");
      }

      // Append to updated_by log
      const updateLog = {
        ...updated_by,
        status_change_notes: status_change_notes ?? null,
        system_message: `Status changed from ${barcodeDoc.status} to ${status} on ${new Date().toISOString()} and conditions set from ${barcodeDoc.conditions} to ${conditions}`,
      };

      // Ensure updated_logs exists as array
      if (!Array.isArray(barcodeDoc.updated_logs)) {
        barcodeDoc.updated_logs = [];
      }
      barcodeDoc.updated_logs.push(updateLog);

      // Update status and conditions
      barcodeDoc.status = status;
      barcodeDoc.conditions = conditions;

      // Save with session
      await barcodeDoc.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Optionally convert to plain object or re-fetch fresh doc outside transaction
      // return barcodeDoc.toObject ? barcodeDoc.toObject() as IBarcode : (barcodeDoc as any as IBarcode);
      return barcodeDoc as unknown as IBarcode;
    } catch (err) {
      // Abort transaction on error
      await session.abortTransaction();

      // Preserve ApiError (e.g., NOT_FOUND) so caller sees original status/message
      if (err instanceof ApiError) throw err;

      // Wrap other errors
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to update barcode status"
      );
    } finally {
      session.endSession();
    }
  }

  async getBarcodesBySku(
    sku: string,
    barcode: string,
    options?: { page?: number; limit?: number; is_used_barcode?: boolean }
  ): Promise<{
    barcode: IBarcode[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.max(1, options?.limit ?? 10);
    const skip = (page - 1) * limit;

    // Build dynamic match object — only add keys if value is provided (truthy)
    const match: Record<string, any> = {};
    if (sku) match.sku = sku;
    if (barcode) match.barcode = barcode;
    if (options && typeof options.is_used_barcode !== "undefined") {
      match.is_used_barcode = options.is_used_barcode;
    }

    // Aggregation pipeline with $facet to get total + paginated data in one query
    const pipeline: any[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
      // Unwind metadata to make reading easier (optional but keeps shape consistent)
      {
        $unwind: {
          path: "$metadata",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          data: 1,
          total: { $ifNull: ["$metadata.total", 0] },
        },
      },
    ];

    const result = (await BarcodeModel.aggregate(pipeline).exec()) as Array<{
      data: IBarcode[];
      total: number;
    }>;

    const agg = result[0] ?? { data: [], total: 0 };

    const total = agg.total ?? 0;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      barcode: agg.data ?? [],
    };
  }

  async getBarcodeDetails(barcode: string): Promise<IBarcode | null> {
    const barcodeDetails = await BarcodeModel.findOne({ barcode }).populate(
      "variant product stock lot"
    );
    return barcodeDetails;
  }
}

export const UniqueBarcodeService = new Service();
