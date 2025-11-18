export enum PRE_ORDER_STATUS {
  INCOMPLETE = "incomplete",
  FAILED = "failed",
  PLACED = "placed",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  ARRIVED_INTERNATIONAL_WAREHOUSE = "arrived_international_warehouse",
  ON_THE_WAY_TO_BD = "on_the_way_to_bd",
  ARRIVED_BD_WAREHOUSE = "arrived_bd_warehouse",
  INSPECTION_IN_PROGRESS = "inspection_in_progress",
  RTS = "rts",
  HANDED_OVER_TO_COURIER = "handed_over_to_courier",
  IN_TRANSIT = "in_transit",
  PENDING = "pending",
  DELIVERED = "delivered",
  PENDING_RETURN = "pending_return",
  RETURNED = "returned",
  CANCELLED = "cancelled",
  EXCHANGE_REQUESTED = "exchange_requested",
  EXCHANGED = "exchanged",
  PARTIAL = "partial",
  UNKNOWN = "unknown",
  LOST = "lost",
}

export enum PAYMENT_STATUS {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PAYMENT_METHOD {
  BKASH = "bkash",
  COD = "cod",
}

export enum ORDER_BY {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
  RESELLER = "reseller",
  CUSTOMER = "customer",
}

export const ORDER_STATUSES_REPORT = [
  "failed",
  "pending",
  "placed",
  "accepted",
  "rts",
  "in_transit",
  "delivered",
  "pending_return",
  "returned",
  "cancelled",
  "exchange_requested",
  "exchanged",
  "incomplete",
  "handed_over_to_courier",
  "unknown",
  "partial",
  "lost",
] as const;
