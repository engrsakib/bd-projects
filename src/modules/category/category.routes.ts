import { Router } from "express";
import { CategoryController } from "./category.controller";
import { CategoryValidations } from "./category.validate";
import { upload } from "@/config/multer";
import validateRequest from "@/middlewares/validateRequest";
import { CategoryMiddleware } from "@/middlewares/upload.category.middleware";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { loggerMiddleware } from "@/middlewares/logger";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  upload.single("image"),
  CategoryMiddleware.uploadCategoryImage,
  validateRequest(CategoryValidations.create),
  loggerMiddleware,
  CategoryController.create
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  CategoryController.getAll
);

router.get("/available", CategoryController.getAvailableCategories);

router.get("/slug/:slug", CategoryController.getBySlug);

router.get(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  CategoryController.getById
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  upload.single("image"),
  CategoryMiddleware.updateCategoryImage,
  validateRequest(CategoryValidations.update),
  loggerMiddleware,
  CategoryController.update
);

router.patch(
  "/:id/status",
  JwtInstance.authenticate(Object.values(ROLES)),
  validateRequest(CategoryValidations.updateStatus),
  loggerMiddleware,
  CategoryController.updateStatus
);

export const CategoryRoutes = router;
