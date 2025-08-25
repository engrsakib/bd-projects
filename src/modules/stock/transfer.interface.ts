import { Model, Schema, Types } from "mongoose";
import { IExpenseApplied } from "../purchase/purchase.interface";

export type IVariantCombination = {
  attribute_values: {
    [key: string]: string; // e.g., { Size: "M", Color: "Red" }
  };

  regular_price: number;
  sale_price: number;
  buying_price?: number;
  sku: string;
  available_quantity: number;
  total_sold: number;
  barcode: string;
  image?: string; // optional: image for this variant
};
// Main Inventory interface
export interface ITProduct {
  product: Types.ObjectId;

  // Variant System
  attributes: string[]; // e.g., ["Size", "Color", "Material"]
  variants: IVariantCombination[]; // all possible combinations

  _id?: Schema.Types.ObjectId;
}

export interface ITransferInventory {
  from: Types.ObjectId;
  to: Types.ObjectId;
  items: {
    variant: Types.ObjectId;
    qty: number; // মোট কত ট্রান্সফার হচ্ছে

    allocations: [
      {
        lot: Types.ObjectId;
        qty: number; // এই লট থেকে কত গেছে
        unit_cost: number; // লটের unit cost
      },
    ];
  }[];
  status?: "completed";
  transferBy: Types.ObjectId;
  expenses_applied?: IExpenseApplied[];
}

export interface ITransferInventoryModel extends Model<ITransferInventory> {}
