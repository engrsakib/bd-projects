import { Router } from "express";
import { BannerController } from "./banner.controller";

const router = Router();

router.post("/", BannerController.create);

export const BannerRoutes = router;
