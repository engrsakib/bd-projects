import { Router } from "express";
import { CourierController } from "./courier.controller";
import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.patch(
  "/transfer-to-courier/bulk",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.transferToCourierBulk
);

router.patch(
  "/transfer-to-courier/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.transferToCourier
);

router.patch(
  "/pre-order/transfer-to-courier/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.transferToCourierPreOrder
);

router.patch(
  "/scan-to-shipping/:orderId",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.scanToShipping
);

router.patch(
  "/scan-to-rts/:orderId",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_UPDATE),
  CourierController.scanToHandOver
);

router.patch(
  "/scan-to-return/:orderId",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_UPDATE),
  CourierController.scanToReturn
);

router.patch(
  "/handle-pending-returns",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_UPDATE),
  CourierController.handlePendingReturns
);

router.get(
  "/status-by-tracking-code/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_VIEW),
  CourierController.statusByTrackingCode
);

export const courierRouter = router;
