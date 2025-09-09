import { Router } from "express";
import { OrderController } from "./order.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.CUSTOMER]),
  OrderController.placeOrder
);

export const OrderRoutes = router;
