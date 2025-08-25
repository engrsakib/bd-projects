import { Router } from "express";
import { SupplierController } from "./supplier.controller";

const router = Router();

router.post(
  "/",
  // verifyToken([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  SupplierController.createSupplier
);

router.get(
  "/",
  // verifyToken([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  SupplierController.getAllSupplier
);

export const SupplierRoutes = router;
