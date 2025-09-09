import { Router } from "express";
import { BkashController } from "./bkash.controller";

const router = Router();

router.get("/execute-callback", BkashController.executePayment);

export const BkashRoutes = router;
