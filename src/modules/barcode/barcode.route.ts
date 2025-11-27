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

router.post(
  "/create-purchase-from-barcodes",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_CREATE),
  UniqueBarcodeController.createPurchaseFromBarcodes
);

router.patch(
  "/update-barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_CREATE),
  UniqueBarcodeController.updateBarcodeStatus
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  UniqueBarcodeController.getBarcodesBySku
);

router.get(
  "/check-used/:barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  UniqueBarcodeController.checkBarcodeUsedOrNot
);

router.get(
  "/:barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_VIEW),
  UniqueBarcodeController.getBarcodeDetails
);

export const UniqueBarcodeRoutes = router;
