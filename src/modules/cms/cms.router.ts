import express from "express";
import { ContentManagementController } from "./cms.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = express.Router();

// Public routes
router.get("/banners", ContentManagementController.getBanners);

// Admin routes
router.patch(
  "/add/banner",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ContentManagementController.addBanner
);
router.patch(
  "/add/banner/:bannerId/:productId",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ContentManagementController.addProductIdToBanner
);
router.patch(
  "/delete/banner/:bannerId/:productId",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ContentManagementController.deleteProductIdToBanner
);
router.delete(
  "/delete-banner/:bannerId",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ContentManagementController.deleteBanner
);

router.get(
  "/featured-products",
  ContentManagementController.getFeaturedProducts
);

router.post(
  "/featured-products",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ContentManagementController.addFeaturedProducts
);
router.delete(
  "/featured-products/:variant_id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ContentManagementController.deleteFeaturedProducts
);

export const ContentManagementRoutes = router;
