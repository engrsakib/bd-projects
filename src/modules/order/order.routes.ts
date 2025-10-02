/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import { OrderController } from "./order.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",

  OrderController.placeOrder
);

router.patch(
  "/update-order-status",

  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.updateOrderStatus
);

router.patch(
  "/:id",

  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.editOrder
);

router.post(
  "/admin/",

  JwtInstance.authenticate([PermissionEnum.ORDER_CREATE]),
  OrderController.placeOrder
);
router.get(
  "/orders/:id",

  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  OrderController.getOrderById
);

router.get(
  "/all-orders",

  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  OrderController.getOrders
);

router.delete(
  "/orders/delete/:id",
  JwtInstance.hasPermissions(PermissionEnum.ORDER_DELETE),
  OrderController.deleteOrder
);

router.get("/orders/track/:id", OrderController.orderTracking);

export const OrderRoutes = router;
