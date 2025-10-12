import { Router } from "express";
import { PurchaseController } from "./purchase.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.get(
  "/search",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_VIEW),
  PurchaseController.getPurchaseByQuery
);

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_CREATE),
  PurchaseController.createPurchase
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_VIEW),
  PurchaseController.getAllPurchases
);

router.get(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_VIEW),
  PurchaseController.getPurchaseById
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_UPDATE),
  PurchaseController.updatePurchase
);

router.patch(
  "/:id/status",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_UPDATE),
  PurchaseController.updateStatus
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.PURCHASE_DELETE),
  PurchaseController.deletePurchase
);

export const PurchaseRoutes = router;
