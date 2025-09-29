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
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  OrderController.editOrder
);

router.post(
  "/admin/",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.authenticate([PermissionEnum.ORDER_CREATE]),
  OrderController.placeOrder
);
router.get(
  "/orders/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  OrderController.getOrderById
);

router.get(
  "/all-orders",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  OrderController.getOrders
);

router.patch(
  "/update-order-status",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  OrderController.updateOrderStatus
);

router.delete(
  "/orders/delete/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_DELETE),
  OrderController.deleteOrder
);

router.get("/orders/track/:id", OrderController.orderTracking);

export const OrderRoutes = router;
