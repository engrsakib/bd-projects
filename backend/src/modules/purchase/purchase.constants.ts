export enum PURCHASE_STATUS_ENUM {
  DRAFT = "draft",
  ORDERED = "ordered",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

export const purchaseFilters = {
  supplier: "supplier",
  location: "location",
  status: "status",
  created_at_start_date: "created_at_start_date",
  created_at_end_date: "created_at_end_date",
  purchase_date_start: "purchase_date_start",
  purchase_date_end: "purchase_date_end",
  purchase_number: "purchase_number",
  received_at_start_date: "received_at_start_date",
  received_at_end_date: "received_at_end_date",
};
