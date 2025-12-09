import { schemaOptions } from "@/utils/schemaOptions";
import { IGlobalStock } from "./globalStock.interface";
import { model, Schema } from "mongoose";

const stocksSchema = new Schema<IGlobalStock>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    available_quantity: { type: Number, required: true },
    total_sold: { type: Number, default: 0 },
    qty_reserved: { type: Number, default: 0 },
    qty_total: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  schemaOptions
);

export const GlobalStockModel = model<IGlobalStock>(
  "GlobalStock",
  stocksSchema
);
