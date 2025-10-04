export const ROLES = {
  // Platform roles
  FOUNDER: "founder",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",

  // Sales & Support roles
  SALES_EXECUTIVE: "sales_executive",
  SUPPORT_ADMIN: "support_admin",
  CUSTOMER_SUPPORT: "customer_support",

  // Management roles
  WAREHOUSE_MANAGER: "warehouse_manager",
  INVENTORY_MANAGER: "inventory_manager",
  ACCOUNT_MANAGER: "account_manager",

  // Customer roles  CUSTOMER: "customer",
  SUBSCRIBER: "subscriber",
  WHOLESALE_BUYER: "wholesale_buyer",
  CUSTOMER: "customer",
};

export type IRoles = (typeof ROLES)[keyof typeof ROLES];
