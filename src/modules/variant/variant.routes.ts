import { Router } from "express";
import { VariantController } from "./variant.controller";

const router = Router();

router.post("/", VariantController.createVariant);

router.patch("/:id", VariantController.updateOne);

router.patch("/many", VariantController.updateMany);

router.delete("/:id", VariantController.deleteVariant);

export const VariantRoutes = router;
