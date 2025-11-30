import { Router } from "express";
import { BkashController } from "./bkash.controller";

const router = Router();

router.get("/execute-callback", BkashController.executePayment);

// router.post("/create-payment", BkashController.createPayment);
// router.get("/execute-payment", BkashController.executePayment);

router.post("/refund", BkashController.refundPayment);

export const BkashRoutes = router;
