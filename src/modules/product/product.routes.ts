import { Router } from "express";
import { ProductController } from "./product.controller";
import { JwtInstance } from "@/lib/jwt";
import { PermissionEnum } from "../permission/permission.enum";
import { ROLES } from "@/constants/roles";

const router = Router();

router.get("/get-by-slug-title", ProductController.getBySlugAndTitle);

router.post(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.PRODUCT_CREATE),
  ProductController.create
);

router.get("/related/:subCategory", ProductController.getRelatedOrders);

router.get(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.PRODUCT_VIEW),
  ProductController.getAllProductsForAdmin
);

router.get("/published", ProductController.getAllProducts);

router.get("/by-ids", ProductController.getProductsByIds);

router.get("/dropdown", ProductController.findAllProducts);

router.get("/:id", ProductController.getById);

router.get("/slug/:slug", ProductController.getBySlug);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.PRODUCT_UPDATE),
  ProductController.update
);

router.patch(
  "/:id/toggle-visibility",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.PRODUCT_UPDATE),
  ProductController.toggleVisibility
);

router.delete(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.PRODUCT_DELETE),
  ProductController.deleteProduct
);

export const ProductRoutes = router;
