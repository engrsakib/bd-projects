import validateRequest from "@/middlewares/validateRequest";
import { Router } from "express";
import { subcategoryValidations } from "./subcategory.validate";
import { SubcategoryController } from "./subcategory.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { loggerMiddleware } from "@/middlewares/logger";
import { upload } from "@/config/multer";
import { SubcategoryMiddleware } from "@/middlewares/upload.subcategory.middleware";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  upload.single("image"),
  SubcategoryMiddleware.uploadSubcategoryImage,
  validateRequest(subcategoryValidations.create),
  loggerMiddleware,
  SubcategoryController.create
);

router.get("/", SubcategoryController.getAll);

router.get("/available", SubcategoryController.getAllAvailable);

router.get("/:id", SubcategoryController.getById);

router.get(
  "/available/by-category/:category_id",
  SubcategoryController.getAvailableByCategory
);

router.get("/slug/:slug", SubcategoryController.getBySlug);

router.get("/by-category/:category_id", SubcategoryController.getByCategory);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  upload.single("image"),
  SubcategoryMiddleware.updateSubcategoryImage,
  validateRequest(subcategoryValidations.update),
  loggerMiddleware,
  SubcategoryController.update
);

router.patch(
  "/:id/status",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  validateRequest(subcategoryValidations.updateStatus),
  loggerMiddleware,
  SubcategoryController.updateStatus
);

export const SubCategoryRoutes = router;
