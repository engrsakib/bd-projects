import { Router } from "express";
import { VariantController } from "./variant.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  VariantController.createVariant
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  VariantController.updateOne
);

router.patch(
  "/many",
  JwtInstance.authenticate(Object.values(ROLES)),
  VariantController.updateMany
);

router.patch(
  "/by-product/:product_id",
  JwtInstance.authenticate(Object.values(ROLES)),
  VariantController.updateVariantsOfAProduct
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  VariantController.deleteVariant
);

router.get("/search-by-sku", VariantController.searchVariantsBySku);

router.get(
  "/search-by-sku/admin",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.ORDER_CREATE),
  VariantController.searchVariantsBySkuForAdmin
);

export const VariantRoutes = router;
