import { model, Schema } from "mongoose";
import { IOrder, IOrderItem } from "./order.interface";
import { schemaOptions } from "@/utils/schemaOptions";
import {
  ORDER_BY,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "./order.enums";
import { addressSchema } from "@/common/models/address.model";

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
  attributes: { type: Map, of: String },
  quantity: { type: Number, required: true, min: 1 },
  lots: {
    type: [
      {
        lotId: { type: Schema.Types.ObjectId, ref: "Lot", required: true },
        deducted: { type: Number, required: true, min: 0 },
      },
    ],
    default: [],
  },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },

    customer_name: { type: String, default: "" },
    customer_number: { type: String, required: true },
    customer_email: { type: String, default: "" },
    customer_secondary_number: { type: String, default: "" },
    orders_by: {
      type: String,
      enum: Object.values(ORDER_BY),
      required: false,
    },

    items: { type: [orderItemSchema], required: true },

    products: { type: [orderItemSchema], required: true },

    total_items: { type: Number, required: true },
    total_price: { type: Number, required: true },
    delivery_charge: { type: Number },
    total_amount: { type: Number },
    discounts: { type: Number, default: 0 },
    paid_amount: { type: Number, default: 0 },
    payable_amount: { type: Number, required: true, default: 0 },

    order_status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    is_delivery_charge_paid: { type: Boolean, default: false },

    order_id: { type: Number, required: true },
    invoice_number: { type: String, required: true },

    delivery_address: addressSchema,

    payment_type: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    transaction_id: { type: String },
    payment_id: { type: String, required: false },
    payment_status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    transfer_to_courier: { type: Boolean, default: false },
    courier: { type: Schema.Types.ObjectId, ref: "Courier", default: null },

    // tracking dates
    order_at: { type: Date, default: new Date() },

    system_message: { type: String, default: "" },
    order_note: { type: String, default: "" },
    notes: { type: String, default: "" },

    logs: [
      {
        user: { type: Schema.Types.ObjectId, ref: "Admin" },
        time: { type: Date, default: Date.now },
        action: { type: String },
      },
    ],
  },
  schemaOptions
);

export const OrderModel = model<IOrder>("Order", orderSchema);
