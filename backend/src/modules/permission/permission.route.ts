/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";

import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionController } from "./permission.controller";
import { PermissionEnum } from "./permission.enum";

const router = Router();

router.patch(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.MANAGE_PERMISSIONS),
  PermissionController.createAndUpdatePermissions
);

export const PermissionsRoutes = router;
