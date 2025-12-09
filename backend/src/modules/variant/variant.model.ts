import { model, Schema } from "mongoose";
import { IVariant } from "./variant.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const variantSchema = new Schema<IVariant>(
  {
    attributes: { type: [String], required: true },
    attribute_values: { type: Map, of: String, required: true },
    regular_price: { type: Number, required: true },
    sale_price: { type: Number, required: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    image: { type: String },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    default_purchase: {
      type: Schema.Types.ObjectId,
      ref: "DefaultsPurchase",
      required: false,
    },
  },
  schemaOptions
);

export const VariantModel = model<IVariant>("Variant", variantSchema);
