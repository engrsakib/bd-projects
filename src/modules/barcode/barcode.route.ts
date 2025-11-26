/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { UniqueBarcodeController } from "./barcode.controller";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_DELETE),
  UniqueBarcodeController.crateBarcodeForStock
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  UniqueBarcodeController.getBarcodesBySku
);

router.get(
  "/:barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  UniqueBarcodeController.getBarcodeDetails
);

export const UniqueBarcodeRoutes = router;
