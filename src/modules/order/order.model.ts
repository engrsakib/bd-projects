import { model, Schema } from "mongoose";
import { IOrder, IOrderItem } from "./order.interface";
import { schemaOptions } from "@/utils/schemaOptions";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from "./order.enums";
import { addressSchema } from "@/common/models/address.model";

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
  attributes: { type: Map, of: String },
  quantity: { type: Number, required: true, min: 1 },
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
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    items: { type: [orderItemSchema], required: true },

    total_items: { type: Number, required: true },
    total_price: { type: Number, required: true },
    delivery_charge: { type: Number },
    total_amount: { type: Number },

    order_id: { type: Number, required: true },
    invoice_number: { type: String, required: true },

    delivery_address: addressSchema,

    payment: {
      method: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        required: true,
      },
      transaction_id: { type: String },
      payment_id: { type: String },
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
      },
    },

    logistics: {
      courier: { type: String },
      tracking_id: { type: String },
      estimated_delivery: { type: Date },
    },

    // tracking dates
    order_at: { type: Date, default: new Date() },
    accepted_at: { type: Date, default: null },
    shipped_at: { type: Date, default: null },
    in_transit_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    pending_return_at: { type: Date, default: null },
    returned_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },

    notes: { type: String },
  },
  schemaOptions
);

export const OrderModel = model<IOrder>("Order", orderSchema);
