import { Schema, model, Types } from "mongoose";
import { ORDER_STATUS } from "../order/order.enums";
import { MARCHANT } from "./courier.interface";

const CourierSchema = new Schema(
  {
    marchant: {
      type: String,
      enum: Object.values(MARCHANT),
      default: MARCHANT.STEAD_FAST,
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
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    Order: {
      type: Types.ObjectId,
      ref: "Order",
      required: true,
    },
    Booking_Date: {
      type: Date,
      required: true,
    },
    Estrimated_Delivery_Date: {
      type: Date,
    },
  },
  { timestamps: true }
);

const CourierModel = model("Courier", CourierSchema);

export default CourierModel;
