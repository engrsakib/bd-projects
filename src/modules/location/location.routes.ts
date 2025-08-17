import { Router } from "express";
import { LocationController } from "./location.controller";
import validateRequest from "@/middlewares/validateRequest";
import { locationValidations } from "./location.validate";
import { JwtInstance } from "@/lib/jwt";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(),
  validateRequest(locationValidations.create),
  LocationController.create
);

export const locationRoutes = router;
