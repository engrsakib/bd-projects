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
// If JwtInstance is an instance, use its middleware method (e.g., JwtInstance.verify(ROLES.ADMIN))
// If JwtInstance should be a function, ensure it is imported as such.
// Example fix assuming JwtInstance.verify is the correct middleware:
router.get(
  "/all-orders",

  OrderController.getOrders
);
export const OrderRoutes = router;
