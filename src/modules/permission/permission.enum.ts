export enum PermissionEnum {
  ORDER_CREATE = "order.create",
  ORDER_DELETE = "order.delete",
  ORDER_UPDATE = "order.update",
  ORDER_VIEW = "order.view",

  PRODUCT_CREATE = "product.create",
  PRODUCT_DELETE = "product.delete",
  PRODUCT_UPDATE = "product.update",
  PRODUCT_VIEW = "product.view",

  USER_CREATE = "user.create",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",
  USER_VIEW = "user.view",

  STOCK_CREATE = "stock.create",
  STOCK_UPDATE = "stock.update",
  STOCK_DELETE = "stock.delete",
  STOCK_VIEW = "stock.view",
  STOCK_TRANSFER = "stock.transfer",
  MANAGE_PERMISSIONS = "manage-permissions",

  VARIANT_CREATE = "variant.create",
  VARIANT_UPDATE = "variant.update",
  VARIANT_DELETE = "variant.delete",
  VARIANT_VIEW = "variant.view",

  CMS_CREATE = "cms.create",
  CMS_UPDATE = "cms.update",
  CMS_DELETE = "cms.delete",
  CMS_VIEW = "cms.view",

  COURIER_CREATE = "courier.create",
  COURIER_UPDATE = "courier.update",
  COURIER_DELETE = "courier.delete",
  COURIER_VIEW = "courier.view",

  SUPPLIER_CREATE = "supplier.create",
  SUPPLIER_UPDATE = "supplier.update",
  SUPPLIER_DELETE = "supplier.delete",
  SUPPLIER_VIEW = "supplier.view",
}

export enum PermissionGroup {
  ORDER = "Order",
  PRODUCT = "Product",
  USER = "User",
  REPORT = "Report",
  PAYMENT = "Payment",
  ADMIN = "Admin",
}
