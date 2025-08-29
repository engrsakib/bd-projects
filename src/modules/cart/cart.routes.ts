import { Router } from "express";
import { CartController } from "./cart.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.CUSTOMER]),
  CartController.addToCart
);

export const CartRoutes = router;
