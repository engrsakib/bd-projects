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

router.get("/", InventoryController.getAllInventories);

router.get("/product/:product_id", InventoryController.getInventoriesByProduct);

router.get(
  "/location/:location_id",
  InventoryController.getInventoriesByLocation
);

router.patch(
  "/:id",
  validateRequest(inventoryValidations.update),
  InventoryController.updateInventory
);

export const InventoryRoutes = router;
