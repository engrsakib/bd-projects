import { Router } from "express";
import { BannerController } from "./banner.controller";
import { upload } from "@/config/multer";
import { BannerMiddleware } from "@/middlewares/upload.banner.middleware";

const router = Router();

router.post(
  "/",
  upload.single("thumbnail"),
  BannerMiddleware.uploadBanner,
  BannerController.create
);

router.get("/", BannerController.getAllBanners);

router.get("/available", BannerController.getAvailableBanners);

router.patch(
  "/:id",
  upload.single("thumbnail"),
  BannerMiddleware.updateBanner,
  BannerController.updateBanner
);

export const BannerRoutes = router;
