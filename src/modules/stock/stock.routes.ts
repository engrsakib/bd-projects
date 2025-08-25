import { Router } from "express";
import { StockController } from "./stock.controller";

const router = Router();

// Admin routes
router.post(
  "/transfer",
  // verifyToken([
  //   UserRole.ADMIN,
  //   UserRole.INVENTORY_MANAGER,
  //   UserRole.SUPER_ADMIN,
  //   UserRole.OUTLET_MANAGER,
  // ]),
  StockController.transferStocks
);

router.get(
  "/transfer-history/:business_location_id",
  // verifyToken([
  //   UserRole.ADMIN,
  //   UserRole.INVENTORY_MANAGER,
  //   UserRole.SUPER_ADMIN,
  //   UserRole.OUTLET_MANAGER,
  // ]),
  StockController.transferHistoryByBusinessLocation
);

router.get(
  "/admin/transfer-history",
  // verifyToken([
  //   UserRole.ADMIN,
  //   UserRole.INVENTORY_MANAGER,
  //   UserRole.SUPER_ADMIN,
  //   UserRole.OUTLET_MANAGER,
  // ]),
  StockController.transferHistoryForAdmin
);

router.get(
  "/",
  // verifyToken([
  //   UserRole.ADMIN,
  //   UserRole.INVENTORY_MANAGER,
  //   UserRole.SUPER_ADMIN,
  // ]),
  StockController.getAllStocks
);

export const stocksRoutes = router;
