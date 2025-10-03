import { Router } from "express";
import { StockController } from "./stock.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/transfer",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.STOCK_TRANSFER),
  StockController.transferStocks
);

router.get(
  "/",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.STOCK_VIEW),
  StockController.getAllStocks
);

router.get("/:variant_id/:product_id", StockController.getStockById);

router.get(
  "/product/:slug",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.STOCK_VIEW),
  StockController.getStockByAProduct
);

router.patch(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.STOCK_UPDATE),
  StockController.updateStock
);

router.delete(
  "/:id",
  JwtInstance.authenticate([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  JwtInstance.hasPermissions(PermissionEnum.STOCK_DELETE),
  StockController.deleteStock
);

export const StocksRoutes = router;
