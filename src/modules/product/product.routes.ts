import { Router } from "express";
import { ProductController } from "./product.controller";
import { upload } from "@/config/multer";
import { ProductMiddleware } from "@/middlewares/upload.product.middleware";

const router = Router();

router.post("/", ProductController.create);

router.get("/published", ProductController.getAllProducts);

router.get("/", ProductController.getAllProductsForAdmin);

router.get("/by-ids", ProductController.getProductsByIds);

router.get("/:id", ProductController.getById);

router.get("/slug/:slug", ProductController.getBySlug);

router.patch(
  "/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "slider_images", maxCount: 5 },
  ]),
  ProductMiddleware.updateImages,
  ProductController.update
);

router.patch("/:id/toggle-visibility", ProductController.toggleVisibility);

export const ProductRoutes = router;
