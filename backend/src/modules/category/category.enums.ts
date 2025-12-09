export enum CATEGORY_STATUS_ENUM {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  DISABLED = "disabled",
  REJECTED = "rejected",
}

export type ICategoryStatus =
  (typeof CATEGORY_STATUS_ENUM)[keyof typeof CATEGORY_STATUS_ENUM];
