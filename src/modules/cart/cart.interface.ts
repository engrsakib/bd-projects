import { Types, Document } from "mongoose";

export type ICartItem = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variant: Types.ObjectId;
  attributes: { [key: string]: string };
  quantity: number;
  price: number; // sale price
};

export type ICart = {
  user: Types.ObjectId;
  items: ICartItem[];
  total_price: number;
} & Document;
