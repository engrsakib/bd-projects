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
  total_price: number; // items price
  delivery_charge?: number;
  total_amount: number; // payable amount = total_price + delivery_charge
  order_id: number; // auto increment
  invoice_number: string; // auto generated
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

  // tracking dates
  order_at?: Date;
  accepted_at?: Date;
  shipped_at?: Date;
  in_transit_at?: Date;
  delivered_at?: Date;
  pending_return_at?: Date;
  returned_at?: Date;
  cancelled_at?: Date;

  status: IOrderStatus;
  notes?: string;
} & Document;
