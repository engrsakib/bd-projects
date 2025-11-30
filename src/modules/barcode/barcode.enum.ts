export enum productBarcodeStatus {
  IN_STOCK = "in_stock",
  ASSIGNED = "assigned",
  QC_PENDING = "qc_pending",
  ALLOCATED = "allocated",
  PICKED = "picked",
  SHIPPED = "shipped",
  SOLD = "sold",
  RETURNED = "returned",
  DAMAGED = "damaged",
  QUARANTINE = "quarantine",
  MISSING = "missing",
  EXPIRED = "expired",
  REFURBISHING = "refurbishing",
  DISCARDED = "discarded",
}

export enum productBarcodeCondition {
  NEW = "new",
  USED = "used",
  REFURBISHED = "refurbished",
  OPEN_BOX = "open_box",
  PACKAGING_DAMAGED = "packaging_damaged",
  DEFECTIVE = "defective",
  PHYSICALLY_DAMAGED = "physically_damaged",
  SCRAP = "scrap",
}
