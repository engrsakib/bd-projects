export enum SUBCATEGORY_STATUS_ENUM {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  DISABLED = "disabled",
  REJECTED = "rejected",
}

export type ISubcategoryStatus =
  (typeof SUBCATEGORY_STATUS_ENUM)[keyof typeof SUBCATEGORY_STATUS_ENUM];
