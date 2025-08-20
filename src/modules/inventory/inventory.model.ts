import { Schema, model } from "mongoose";
import { IInventory, IVariant } from "./inventory.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const variantSchema = new Schema<IVariant>(
  {
    attribute_values: {
      type: Map,
      of: String,
      required: true,
    },
    regular_price: { type: Number, required: true },
    sale_price: { type: Number, required: true },
    buying_price: { type: Number, required: false, default: null },
    sku: { type: String, required: true, unique: true, index: true },
    available_quantity: { type: Number, required: true },
    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    total_sold: { type: Number, default: 0 },
    image: { type: String, default: "" },
  },
  schemaOptions
);

const inventorySchema = new Schema<IInventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },

    attributes: { type: [String], required: true, min: 1 },
    variants: { type: [variantSchema], required: true, min: 1 },
    location: {
      type: Schema.Types.ObjectId,
      ref: "location",
      required: true,
      unique: true,
      index: true,
    },
  },
  schemaOptions
);

export const InventoryModel = model<IInventory>("Inventory", inventorySchema);
