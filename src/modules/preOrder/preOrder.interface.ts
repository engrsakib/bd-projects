import { Types } from "mongoose";

export type IPreOrderStatus =
  | "incomplete"
  | "pending"
  | "pending_approval"
  | "failed"
  | "purchased"
  | "on_the_way_to_bd"
  | "arrived_bd_warehouse"
  | "inspection_in_progress"
  | "ready_for_dispatch"
  | "accepted"
  | "rts"
  | "handed_over_to_courier"
  | "in_transit"
  | "delivered"
  | "pending_return"
  | "returned"
  | "cancelled"
  | "exchange_requested"
  | "exchanged"
  | "partial"
  | "unknown"
  | "lost";

export type IPreOrderItem = {
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
  status?: IPreOrderStatus;
};
