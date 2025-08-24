import { Schema, model } from "mongoose";
import { IInventory } from "./inventory.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const inventorySchema = new Schema<IInventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    variants: { type: [Schema.Types.ObjectId], required: true, min: 1 },
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

inventorySchema.index({ product: 1, location: 1 }, { unique: true });

export const InventoryModel = model<IInventory>("Inventory", inventorySchema);
