import { Router } from "express";
import { PurchaseController } from "./purchase.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  PurchaseController.createPurchase
);

router.get("/", PurchaseController.getAllPurchases);

router.get("/:id", PurchaseController.getPurchaseById);

router.patch("/:id", PurchaseController.updatePurchase);

router.patch("/:id/status", PurchaseController.updateStatus);

router.delete("/:id", PurchaseController.deletePurchase);

export const PurchaseRoutes = router;
