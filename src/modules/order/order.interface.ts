import { IAddress } from "@/interfaces/common.interface";
import { Types } from "mongoose";
import { IUser } from "../user/user.interface";

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
  | "handed_over_to_courier"
  | "unknown"
  | "partial"
  | "lost"
  | "awaiting_stock";

export type ReportParams = {
  start_date?: string;
  end_date?: string;
  user?: string; // ObjectId string (optional)
};

export type IOrderBy = "admin" | "user" | "guest" | "reseller";

type IAdminNote = {
  note: string;
  added_at: Date;
  added_by: IUser["_id"];
};

export type IOrderItem = {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  previous_variant?: Types.ObjectId;
  attributes: { [key: string]: string };
  lots: [
    {
      lotId: Types.ObjectId;
      deducted: number;
    },
  ];
  quantity: number;
  price: number;
  new_cod?: number;
  subtotal: number;
  total_sold?: number;
  status?: IOrderStatus;
};

export type IOrderLog = {
  user?: Types.ObjectId | "webhook" | null;
  time: Date;
  action: string;
};

export type Istatus_count = Record<IOrderStatus, number>;

export type IOrder = {
  user?: Types.ObjectId;
  previous_order?: Types.ObjectId | string;
  customer_name?: string;
  customer_number: string;
  customer_email?: string;
  customer_secondary_number?: string;

  user_or_admin_model?: "User" | "Admin";

  items?: IOrderItem[];
  orders_by: IOrderBy;
  products?: IOrderItem[];
  total_items: number;
  total_price: number;
  delivery_charge?: number;
  total_amount: number;
  paid_amount?: number;
  payable_amount?: number;
  new_cod?: number;
  discounts?: number;
  order_status?: IOrderStatus;
  transfer_to_courier?: boolean;
  courier?: Types.ObjectId;
  order_id?: number;
  invoice_number: string;
  delivery_address: IAddress;
  payment_type: "bkash" | "cod";
  transaction_id?: string;
  payment_info?: Types.ObjectId | string | null;
  payment_id?: string | Types.ObjectId;
  payment_status?: "pending" | "paid" | "failed" | "refunded";

  order_at?: Date;

  is_delivery_charge_paid?: boolean;

  system_message?: [string];
  order_note?: string;
  admin_notes?: IAdminNote[];

  notes?: string;
  id?: string | Types.ObjectId;

  order_type?: "regular" | "exchange" | "return";

  is_pre_order?: boolean;

  logs?: IOrderLog[];
};

export type IOrderPlace = {
  user_id: string | Types.ObjectId;
  previous_order?: string | Types.ObjectId;
  customer_name?: string;
  customer_number: string;
  customer_secondary_number?: string;
  customer_email?: string;
  delivery_charge?: number;
  order_type?: "regular" | "exchange" | "return";
  tax?: number;
  paid_amount?: number;
  discounts?: number;
  new_cod?: number;
  delivery_address: IAddress;
  products: IOrderItem[];
  payment_type: "bkash" | "cod";
  orders_by: IOrderBy;
};
