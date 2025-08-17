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

router.get("/", JwtInstance.authenticate(), LocationController.getAllLocations);

router.get("/:id", JwtInstance.authenticate(), LocationController.getById);

export const locationRoutes = router;
