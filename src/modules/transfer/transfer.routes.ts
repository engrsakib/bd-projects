import { Router } from "express";
import { TransferController } from "./transfer.controller";

const router = Router();

router.get("/", TransferController.getAllTransfers);

router.get("/:location", TransferController.getByLocation);

export const TransferRoutes = router;
