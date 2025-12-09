import { Schema, model } from "mongoose";
import { IStock } from "./stock.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const stocksSchema = new Schema<IStock>(
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
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    available_quantity: { type: Number, required: true },
    total_sold: { type: Number, default: 0 },
    qty_reserved: { type: Number, default: 0 },
  },
  schemaOptions
);

export const StockModel = model<IStock>("Stock", stocksSchema);
