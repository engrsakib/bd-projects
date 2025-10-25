import { Router } from "express";
import { SupplierController } from "./supplier.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.SUPPLIER_CREATE),
  SupplierController.createSupplier
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.SUPPLIER_VIEW),
  SupplierController.getAllSupplier
);

export const SupplierRoutes = router;
