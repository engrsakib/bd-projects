import { Router } from "express";
import { StockController } from "./stock.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.post(
  "/transfer",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.transferStocks
);

router.get(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.getAllStocks
);

router.get(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.getStockById
);

router.get(
  "/product/:slug",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.getStockByAProduct
);

router.get(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.getStockById
);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.updateStock
);

router.delete(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  StockController.deleteStock
);

export const StocksRoutes = router;
