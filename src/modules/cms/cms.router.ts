import express from "express";
import { ContentManagementController } from "./cms.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = express.Router();

// Public routes
router.get("/banners", ContentManagementController.getBanners);

// Admin routes
router.patch(
  "/add/banner",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.CMS_UPDATE),
  ContentManagementController.addBanner
);
router.patch(
  "/add/banner/:bannerId/:productId",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.CMS_UPDATE),
  ContentManagementController.addProductIdToBanner
);
router.patch(
  "/delete/banner/:bannerId/:productId",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.CMS_UPDATE),
  ContentManagementController.deleteProductIdToBanner
);
router.delete(
  "/delete-banner/:bannerId",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.CMS_DELETE),
  ContentManagementController.deleteBanner
);

router.get(
  "/featured-products",
  ContentManagementController.getFeaturedProducts
);

router.post(
  "/featured-products",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.CMS_CREATE),
  ContentManagementController.addFeaturedProducts
);
router.delete(
  "/featured-products/:variant_id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.CMS_DELETE),
  ContentManagementController.deleteFeaturedProducts
);

export const ContentManagementRoutes = router;
