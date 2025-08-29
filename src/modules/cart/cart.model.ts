import { Schema, model } from "mongoose";
import { ICart, ICartItem } from "./cart.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
    attributes: { type: Map, of: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true },
  },
  schemaOptions
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [CartItemSchema], default: [] },
    total_price: { type: Number, default: 0 },
  },
  schemaOptions
);

export const CartModel = model("Cart", CartSchema);
