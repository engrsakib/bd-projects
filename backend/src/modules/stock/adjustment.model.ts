import { model, Schema } from "mongoose";
import {
  IAdjustStocks,
  IAdjustStocksModel,
  IVariantCombination,
} from "./adjusment.interface";

const selectedVariantSchema = new Schema<IVariantCombination>({
  attribute_values: {
    type: Map,
    of: String,
    required: true,
  },
  sku: { type: String, required: true },
  image: { type: String },
  regular_price: { type: Number, required: true },
  sale_price: { type: Number, required: true },
  barcode: { type: String, required: true },
  _id: { type: Schema.Types.ObjectId, ref: "Variants" },
});

const stocksAdjustmentSchema = new Schema<IAdjustStocks>(
  {
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Products",
        },
        quantity: {
          type: Number,
          required: true,
        },
        selected_variant: selectedVariantSchema,
        unit_price: {
          type: Number,
          required: true,
        },
        total_price: {
          type: Number,
          required: true,
        }, // quantity * quantity
        product_note: {
          type: String,
        },
        stock: {
          type: Schema.Types.ObjectId,
          ref: "Stocks",
          required: true,
        },
      },
    ],
    note: { type: String },
    action: { type: String, enum: ["ADDITION", "DEDUCTION"] },
    total_amount: { type: Number },
    adjust_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    activities_date: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export const AdjustedStocks = model<IAdjustStocks, IAdjustStocksModel>(
  "AdjustedStocks",
  stocksAdjustmentSchema
);
