import { Types } from "mongoose";

export type IGlobalStock = {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  available_quantity: number;
  total_sold?: number;
  qty_reserved: number; // cart/reservation (optional)
};
