import { IAddress } from "@/interfaces/common.interface";
import { Types } from "mongoose";

type IOrderStatus =
  | "failed"
  | "pending"
  | "placed"
  | "accepted"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "pending_return"
  | "returned"
  | "cancelled"
  | "exchange_requested"
  | "exchanged"
  | "partial_delivered";

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
  user?: Types.ObjectId;
  items?: IOrderItem[];
  products?: IOrderItem[]; // for order placement
  total_items: number;
  total_price: number; // items price
  delivery_charge?: number;
  total_amount: number; // payable amount = total_price + delivery_charge + tax etc.
  paid_amount?: number; // total paid amount by the customer
  payable_amount?: number; // total payable amount = total_price + tax etc - delivery_charge.
  order_status?: IOrderStatus;
  order_id?: number; // auto increment
  invoice_number: string; // auto generated
  delivery_address: IAddress;
  payment_type: "bkash" | "cod";
  transaction_id?: string;
  payment_id?: string;
  payment_status?: "pending" | "paid" | "failed" | "refunded";

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

  is_delivery_charge_paid?: boolean;

  system_message?: string; // system generated messages
  order_note?: string; // admin provided note
  // for guest user email and phone will be stored in address field
  notes?: string; //user provided note during order placement
  id?: string | Types.ObjectId;
};

export type IOrderPlace = {
  user_id: string | Types.ObjectId; // from req.user.id to retrieve cart
  delivery_charge?: number; // optional
  tax?: number; // optional
  discounts?: number;
  delivery_address: IAddress;
  products: IOrderItem[];
  payment_type: "bkash" | "cod";
};
