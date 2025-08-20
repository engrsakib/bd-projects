import validateRequest from "@/middlewares/validateRequest";
import { InventoryController } from "./inventory.controller";
import { Router } from "express";
import { inventoryValidations } from "./inventory.validate";

const router = Router();

router.post(
  "/",
  validateRequest(inventoryValidations.create),
  InventoryController.create
);

export const InventoryRoutes = router;
