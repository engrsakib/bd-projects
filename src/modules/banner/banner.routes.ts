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

export const BannerRoutes = router;
