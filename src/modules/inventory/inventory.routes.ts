import { InventoryController } from "./inventory.controller";
import { Router } from "express";

const router = Router();

router.post("/", InventoryController.create);

export const InventoryRoutes = router;
