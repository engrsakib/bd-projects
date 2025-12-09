import { model, Schema } from "mongoose";
import { IBarcode, IupdateLogs } from "./barcode.interface";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";

const UpdateBySchema = new Schema<IupdateLogs>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    admin_note: { type: String, required: false, default: "" },
    system_message: { type: String, required: false, default: "" },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const BarcodeSchema = new Schema<IBarcode>(
  {
    barcode: { type: String, required: true, unique: true },
    sku: { type: String, required: true },

    variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    lot: {
      type: Schema.Types.ObjectId,
      ref: "Lot",
      required: false,
      default: null,
    },
    stock: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: false,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(productBarcodeStatus),
      required: true,
    },
    conditions: {
      type: String,
      enum: Object.values(productBarcodeCondition),
      required: false,
      default: "",
    },
    is_used_barcode: { type: Boolean, required: false, default: false },
    updated_logs: { type: [UpdateBySchema], required: false, default: [] },
  },
  { timestamps: true }
);

export const BarcodeModel = model<IBarcode>("Barcode", BarcodeSchema);
