import { IAddress } from "@/interfaces/common.interface";
import { Types } from "mongoose";

export type IOrderStatus =
  | "failed"
  | "pending"
  | "placed"
  | "accepted"
  | "rts"
  | "in_transit"
  | "delivered"
  | "pending_return"
  | "returned"
  | "cancelled"
  | "exchange_requested"
  | "exchanged"
  | "incomplete"
  | "partial"
  | "lost";

export type IOrderBy = "admin" | "user" | "guest" | "reseller";

export type IOrderItem = {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  attributes: { [key: string]: string };
  lots: [
    {
      lotId: Types.ObjectId;
      deducted: number;
    },
  ];
  quantity: number;
  price: number;
  subtotal: number;
  status?: IOrderStatus;
};

export type IOrderLog = {
  user?: Types.ObjectId | "webhook" | null;
  time: Date;
  action: string;
};

export type IOrder = {
  user?: Types.ObjectId;
  previousOrderId?: Types.ObjectId | string;
  customer_name?: string;
  customer_number: string;
  customer_email?: string;
  customer_secondary_number?: string;

  items?: IOrderItem[];
  orders_by: IOrderBy;
  products?: IOrderItem[];
  total_items: number;
  total_price: number;
  delivery_charge?: number;
  total_amount: number;
  paid_amount?: number;
  payable_amount?: number;
  discounts?: number;
  order_status?: IOrderStatus;
  transfer_to_courier?: boolean;
  courier?: Types.ObjectId;
  order_id?: number;
  invoice_number: string;
  delivery_address: IAddress;
  payment_type: "bkash" | "cod";
  order_type?: "regular" | "exchange" | "return";
  transaction_id?: string;
  payment_id?: string;
  payment_status?: "pending" | "paid" | "failed" | "refunded";

  order_at?: Date;

  is_delivery_charge_paid?: boolean;

  system_message?: string;
  order_note?: string;

  notes?: string;
  id?: string | Types.ObjectId;

  logs?: IOrderLog[];
};

export type IOrderPlace = {
  user_id: string | Types.ObjectId;
  previousOrderId?: string | Types.ObjectId;
  customer_name?: string;
  customer_number: string;
  customer_secondary_number?: string;
  customer_email?: string;
  delivery_charge?: number;
  tax?: number;
  paid_amount?: number;
  discounts?: number;
  delivery_address: IAddress;
  products: IOrderItem[];
  payment_type: "bkash" | "cod";
  orders_by: IOrderBy;
};
