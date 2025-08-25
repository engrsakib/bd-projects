import { Router } from "express";
import { PurchaseController } from "./purchase.controller";
import validateRequest from "../../middlewares/validateRequest";
import { PurchaseValidationSchema } from "./purchase.zod";

const router = Router();

router.post(
  "/",
  validateRequest(PurchaseValidationSchema.createPurchaseSchema),
  //  verifyToken([
  //     UserRole.ADMIN,
  //     UserRole.INVENTORY_MANAGER,
  //     UserRole.SUPER_ADMIN,
  //   ]),
  PurchaseController.createPurchase
);

router.get(
  "/",
  // verifyToken([
  //     UserRole.ADMIN,
  //     UserRole.INVENTORY_MANAGER,
  //     UserRole.SUPER_ADMIN,
  //   ]),
  PurchaseController.getAllPurchases
);

router.get("/:id", PurchaseController.getPurchaseById);

router.patch(
  "/:id",
  validateRequest(PurchaseValidationSchema.updatePurchaseSchema),
  PurchaseController.updatePurchase
);

router.patch(
  "/:id/status",
  validateRequest(PurchaseValidationSchema.updateStatusPurchaseSchema),
  PurchaseController.updateStatus
);

router.delete(
  "/:id",
  validateRequest(PurchaseValidationSchema.deletePurchaseSchema),
  PurchaseController.deletePurchase
);

export const PurchaseRoutes = router;
