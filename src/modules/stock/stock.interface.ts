import { Types } from "mongoose";

export type IStock = {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  location: Types.ObjectId;
  available_quantity: number;
  total_sold?: number;
  qty_reserved: number; // cart/reservation (optional)
};
