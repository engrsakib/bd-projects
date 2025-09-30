import { Router } from "express";
import { VariantController } from "./variant.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN]),
  VariantController.createVariant
);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  VariantController.updateOne
);

router.patch(
  "/many",
  JwtInstance.authenticate([ROLES.ADMIN]),
  VariantController.updateMany
);

router.patch(
  "/by-product/:product_id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  VariantController.updateVariantsOfAProduct
);

router.delete(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  VariantController.deleteVariant
);

router.get("/search-by-sku", VariantController.searchVariantsBySku);

export const VariantRoutes = router;
