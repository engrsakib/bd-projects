import { Router } from "express";
import { TransferController } from "./transfer.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.get(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  TransferController.getAllTransfers
);

router.get(
  "/:location",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  TransferController.getByLocation
);

export const TransferRoutes = router;
