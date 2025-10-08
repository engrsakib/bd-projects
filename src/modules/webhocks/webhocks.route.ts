import { Router } from "express";
import { WebhocksController } from "./webhocks.controller";

const router = Router();

router.post("/steadfast", WebhocksController.steadfastWebhock);

export const WebhocksRoutes = router;
