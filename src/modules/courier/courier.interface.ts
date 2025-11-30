import { ORDER_STATUS } from "../order/order.enums";
import { Types } from "mongoose";

export enum MARCHANT {
  PATHAO = "pathao",
  REDEX = "redex",
  FEDEX = "fedex",
  STEAD_FAST = "steadfast",
  CARRY_BEE = "carrybee",
}

export type TCourierPayload = {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
};

export interface ICourier {
  _id?: Types.ObjectId | string;
  merchant: MARCHANT;
  tracking_url?: string;
  tracking_id?: string;
  order_status: ORDER_STATUS;
  order: Types.ObjectId;
  booking_date: Date;
  cod_amount?: number;
  courier_note?: string;
  consignment_id?: string;
  transfer_to_courier: boolean;
  is_pre_order?: boolean;
  delivery_man?: string;
  delivery_man_phone?: string;
  estimated_delivery_date?: Date;
  accepted_at?: Date;
  shipped_at?: Date;
  in_transit_at?: Date;
  delivered_at?: Date;
  pending_return_at?: Date;
  returned_at?: Date;
  cancelled_at?: Date;
}
