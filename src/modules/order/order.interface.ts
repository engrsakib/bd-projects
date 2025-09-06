import { IAddress } from "@/interfaces/common.interface";
import { Types, Document } from "mongoose";

type IOrderStatus =
  | "pending"
  | "accepted"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "pending_return"
  | "returned"
  | "cancelled";

export type IOrderItem = {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  attributes: { [key: string]: string };
  quantity: number;
  price: number;
  subtotal: number;
  status?: IOrderStatus;
};

export type IOrder = {
  user: Types.ObjectId;
  items: IOrderItem[];
  total_items: number;
  total_price: number;
  delivery_address: IAddress;
  payment: {
    method: "bkash" | "cod";
    transaction_id?: string;
    payment_id?: string;
    status: "pending" | "paid" | "failed" | "refunded";
  };

  logistics?: {
    courier?: string;
    tracking_id?: string;
    estimated_delivery?: Date;
  };
  status: IOrderStatus;
  notes?: string;
} & Document;
