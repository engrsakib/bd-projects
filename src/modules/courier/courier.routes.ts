import { Router } from "express";
import { CourierController } from "./courier.controller";
import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.patch(
  "/transfer-to-courier/:order_id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_CREATE),
  CourierController.transferToCourier
);

router.get(
  "/status-by-tracking-code/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.COURIER_VIEW),
  CourierController.statusByTrackingCode
);

export const courierRouter = router;
