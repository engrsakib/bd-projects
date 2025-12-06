/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import { OrderController } from "./order.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { ORDER_STATUSES_REPORT } from "./order.enums";

const router = Router();

router.post(
  "/",

  OrderController.placeOrder
);

router.get(
  "/report",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_REPORT_VIEW),
  OrderController.generateOrderReport
);

router.get(
  "/user",
  JwtInstance.authenticate(Object.values(ROLES)),
  OrderController.loginUserOrder
);

router.patch(
  "/update-order-admin-notes/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.addAdminNoteToOrder
);

router.patch(
  "/send-order-to-accepted/:orderId",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.setOrderReadyForAccepted
);

router.patch(
  "/super-update-order-status/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.superUpdateOrderStatus
);

router.patch(
  "/cancel-order/awaiting-stock/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.cancleOrder
);

router.patch(
  "/update-order-status",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.updateOrderStatus
);
router.patch(
  "/update-order-status/bulk",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.updateOrderStatusBulk
);

// status update by admin

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.editOrder
);

router.post(
  "/admin/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_CREATE),
  OrderController.placeOrderAdmin
);

router.post(
  "/admin/exchange",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.placeExchangeOrReturnOrder
);

router.get(
  "/orders/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  OrderController.getOrderById
);

router.get(
  "/all-orders",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  OrderController.getOrders
);

router.delete(
  "/orders/delete/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_DELETE),
  OrderController.deleteOrder
);

router.get("/orders/track/:id", OrderController.orderTracking);

export const OrderRoutes = router;
