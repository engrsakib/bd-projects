export enum ORDER_STATUS {
  PENDING = "pending",
  FAILED = "failed",
  PLACED = "placed",
  ACCEPTED = "accepted",
  SHIPPED = "shipped",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  PENDING_RETURN = "pending_return",
  RETURNED = "returned",
  CANCELLED = "cancelled",
  EXCHANGE_REQUESTED = "exchange_requested",
  EXCHANGED = "exchanged",
  PARTIAL_DELIVERED = "partial_delivered",
  HANDED_OVER_TO_COURIER = "handed_over_to_courier",
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
