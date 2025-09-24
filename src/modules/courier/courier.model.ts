import { Schema, model, Types } from "mongoose";
import { ORDER_STATUS } from "../order/order.enums";
import { ICourier, MARCHANT } from "./courier.interface";

const CourierSchema = new Schema(
  {
    merchant: {
      type: String,
      enum: Object.values(MARCHANT),
      required: true,
    },
    tracking_url: {
      type: String,
      trim: true,
    },
    tracking_id: {
      type: String,
      trim: true,
    },
    order_status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    order: {
      type: Types.ObjectId,
      ref: "Order",
      required: false,
    },
    delivery_man: {
      type: String,
      trim: true,
    },
    delivery_man_phone: {
      type: String,
      trim: true,
    },
    cod_amount: {
      type: Number,
      default: 0,
    },
    courier_note: {
      type: String,
      trim: true,
    },
    consignment_id: {
      type: String,
      trim: true,
    },
    transfer_to_courier: {
      type: Boolean,
    },
    booking_date: {
      type: Date,
      required: false,
    },
    estimated_delivery_date: {
      type: Date,
    },
    accepted_at: { type: Date, default: null },
    shipped_at: { type: Date, default: null },
    in_transit_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    pending_return_at: { type: Date, default: null },
    returned_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const CourierModel = model<ICourier>("Courier", CourierSchema);

export default CourierModel;
