import { model, Schema } from "mongoose";
import { schemaOptions } from "@/utils/schemaOptions";
import { IDefaultsPurchase } from "./default-purchase.interface";

const defaultsPurchaseSchema = new Schema<IDefaultsPurchase>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
      unique: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    unit_cost: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
  },
  schemaOptions
);

export const DefaultsPurchaseModel = model<IDefaultsPurchase>(
  "DefaultsPurchase",
  defaultsPurchaseSchema
);
