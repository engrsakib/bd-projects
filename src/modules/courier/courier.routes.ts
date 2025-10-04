import { Router } from "express";
import { CourierController } from "./courier.controller";
import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.patch(
  "/transfer-to-courier/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.transferToCourier
);

router.patch(
  "/scan-to-shipping",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.scanToShipping
);

router.get(
  "/status-by-tracking-code/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_VIEW),
  CourierController.statusByTrackingCode
);

export const courierRouter = router;
