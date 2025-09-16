/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import { OrderController } from "./order.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.post(
  "/",

  OrderController.placeOrder
);
router.get("/tracking", OrderController.getOrderById);
router.get("/all-orders", OrderController.getOrders);
export const OrderRoutes = router;
