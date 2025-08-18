import validateRequest from "@/middlewares/validateRequest";
import { Router } from "express";
import { subcategoryValidations } from "./subcategory.validate";
import { SubcategoryController } from "./subcategory.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { loggerMiddleware } from "@/middlewares/logger";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  validateRequest(subcategoryValidations.create),
  loggerMiddleware,
  SubcategoryController.create
);

router.get("/", SubcategoryController.getAll);

router.get("/:id", SubcategoryController.getById);

router.get("/slug/:slug", SubcategoryController.getBySlug);

router.get("/by-category/:category_id", SubcategoryController.getByCategory);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  validateRequest(subcategoryValidations.update),
  loggerMiddleware,
  SubcategoryController.update
);

export const SubCategoryRoutes = router;
