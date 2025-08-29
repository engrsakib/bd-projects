import { Router } from "express";
import { CartController } from "./cart.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import validateRequest from "@/middlewares/validateRequest";
import { cartValidations } from "./cart.validate";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate([ROLES.CUSTOMER]),
  validateRequest(cartValidations.addToCart),
  CartController.addToCart
);

export const CartRoutes = router;
