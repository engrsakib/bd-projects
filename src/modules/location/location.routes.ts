import { Router } from "express";
import { LocationController } from "./location.controller";

const router = Router();

router.post("/", LocationController.create);

export const locationRoutes = router;
