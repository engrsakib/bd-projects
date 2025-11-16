import { Router } from "express";
// import validateRequest from "@/middlewares/validateRequest";
import { JwtInstance } from "@/lib/jwt";
import { DefaultsPurchaseController } from "./default-purchase.controller";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();
router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DEFAULTS_PURCHASE),

  DefaultsPurchaseController.createPurchase
);

export const defaultPurchaseRoutes = router;
