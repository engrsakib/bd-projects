import { Router } from "express";
import { VariantController } from "./variant.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.VARIANT_CREATE),
  VariantController.createVariant
);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.VARIANT_UPDATE),
  VariantController.updateOne
);

router.patch(
  "/many",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.VARIANT_UPDATE),
  VariantController.updateMany
);

router.patch(
  "/by-product/:product_id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.VARIANT_UPDATE),
  VariantController.updateVariantsOfAProduct
);

router.delete(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.VARIANT_DELETE),
  VariantController.deleteVariant
);

router.get("/search-by-sku", VariantController.searchVariantsBySku);

export const VariantRoutes = router;
