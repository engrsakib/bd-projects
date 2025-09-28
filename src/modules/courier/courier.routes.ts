import { Router } from "express";
import { CourierController } from "./courier.controller";
import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";

const router = Router();

router.patch(
  "/transfer-to-courier/:order_id",
  JwtInstance.authenticate([ROLES.ADMIN]),
  CourierController.transferToCourier
);

router.get(
  "/status-by-tracking-code/:id",
  CourierController.statusByTrackingCode
);

export const courierRouter = router;
