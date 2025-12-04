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
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_GENERATE),
  UniqueBarcodeController.crateBarcodeForStock
);

router.post(
  "/create-purchase-from-barcodes",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_ASSIGN_STOCK),
  UniqueBarcodeController.createPurchaseFromBarcodes
);

router.patch(
  "/update-barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_UPDATE),
  UniqueBarcodeController.updateBarcodeStatus
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_VIEW),
  UniqueBarcodeController.getBarcodesBySku
);

router.get(
  "/check-used/:barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_VIEW),
  UniqueBarcodeController.checkBarcodeUsedOrNot
);

router.get(
  "/:barcode",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_VIEW),
  UniqueBarcodeController.getBarcodeDetails
);

router.get(
  "/:order_id/check-barcode-exists",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.BARCODE_VIEW),
  UniqueBarcodeController.checkIsBarcodeExistsAndReadyForUse
);

router.post(
  "/:order_id/process-order-barcodes",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  UniqueBarcodeController.processOrderBarcodes
);

router.post(
  "/:order_id/process-return-barcodes",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_UPDATE),
  UniqueBarcodeController.processReturnBarcodes
);

export const UniqueBarcodeRoutes = router;
