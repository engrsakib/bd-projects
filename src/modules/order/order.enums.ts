export enum ORDER_STATUS {
  INCOMPLETE = "incomplete",
  PENDING = "pending",
  FAILED = "failed",
  PLACED = "placed",
  ACCEPTED = "accepted",
  SHIPPED = "shipped",
  HANDED_OVER_TO_COURIER = "handed_over_to_courier",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  PENDING_RETURN = "pending_return",
  RETURNED = "returned",
  CANCELLED = "cancelled",
  EXCHANGE_REQUESTED = "exchange_requested",
  EXCHANGED = "exchanged",
  PARTIAL_DELIVERED = "partial_delivered",
  UNKNOWN = "unknown",
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
}
