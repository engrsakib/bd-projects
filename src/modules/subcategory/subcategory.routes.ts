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

// ADMIN routes
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

router.get("/by-category/:category_id", SubcategoryController.getByCategory);

router.get("/:id", SubcategoryController.getById);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  upload.single("image"),
  SubcategoryMiddleware.updateSubcategoryImage,
  validateRequest(subcategoryValidations.update),
  loggerMiddleware,
  SubcategoryController.update
);

// PUBLIC routes
router.get("/available", SubcategoryController.getAllAvailable);

router.get(
  "/available/by-category/:category_id",
  SubcategoryController.getAvailableByCategory
);

router.get("/slug/:slug", SubcategoryController.getBySlug);

export const SubCategoryRoutes = router;
