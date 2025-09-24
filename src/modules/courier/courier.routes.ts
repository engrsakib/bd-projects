import { Router } from "express";
import { CourierController } from "./courier.controller";

const router = Router();

router.patch(
  "/transfer-to-courier/:order_id",
  // JwtInstance.authenticate([ROLES.ADMIN]),
  CourierController.transferToCourier
);

export const courierRouter = router;
