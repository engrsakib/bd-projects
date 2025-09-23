import { ORDER_STATUS } from "../order/order.enums";
import { Types } from "mongoose";

export enum MARCHANT {
  PATHAO = "pathao",
  REDEX = "redex",
  FEDEX = "fedex",
  STEAD_FAST = "steadfast",
  CARRY_BEE = "carrybee",
}

export interface ICourier {
  marchant: MARCHANT;
  tracking_url?: string;
  tracking_id?: string;
  status: ORDER_STATUS;
  Order: Types.ObjectId;
  Booking_Date: Date;
  Estrimated_Delivery_Date?: Date;
}
