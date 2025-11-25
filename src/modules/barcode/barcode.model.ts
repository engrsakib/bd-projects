import { model, Schema } from "mongoose";
import { IBarcode, updateBy as IUpdateBy } from "./barcode.interface";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";

const UpdateBySchema = new Schema<IUpdateBy>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    reason: { type: String, required: false },
    status_change_notes: { type: String, required: false },
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
    updated_by: { type: [UpdateBySchema], required: false, default: [] },
  },
  { timestamps: true }
);

export const BarcodeModel = model<IBarcode>("Barcode", BarcodeSchema);
