import { Router } from "express";
import { ProductController } from "./product.controller";
import { upload } from "@/config/multer";
import { ProductMiddleware } from "@/middlewares/upload.product.middleware";

const router = Router();

router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "slider_images", maxCount: 5 },
  ]),
  ProductMiddleware.uploadImages,
  ProductController.create
);

router.get("/", ProductController.getAllProducts);

export const ProductRoutes = router;
