import { Router } from "express";
import { VariantController } from "./variant.controller";

const router = Router();

router.post("/", VariantController.createOne);

router.post("/many", VariantController.createMany);

router.patch("/:id", VariantController.updateOne);

router.patch("/many", VariantController.updateMany);

export const VariantRoutes = router;
