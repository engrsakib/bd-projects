// import express from "express";
// import validateRequest from "../../middlewares/validateRequest";
// import { OutletValidationSchema } from "./outlets.zod";
// import { outletController } from "./outlets.controller";
// import verifyToken from "../../middlewares/verifyToken";
// import { UserRole } from "../users/user.constant";
// const router = express.Router();

// // Public routes
// router.get(
//   "/",
//   validateRequest(OutletValidationSchema.getOutletsZodSchema),
//   outletController.getAllWarehousesOutlets
// );
// router.get(
//   "/warehouses",
//   validateRequest(OutletValidationSchema.getOutletsZodSchema),
//   outletController.getAllWarehouses
// );
// router.get(
//   "/outlets",
//   validateRequest(OutletValidationSchema.getOutletsZodSchema),
//   outletController.getAllOutlets
// );
// router.get(
//   "/:id",
//   validateRequest(OutletValidationSchema.getOutletByIdZodSchema),
//   outletController.getOutletById
// );
// router.get(
//   "/inventory/:outlet_id/:product_id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//     UserRole.OUTLET_MANAGER,
//   ]),
//   outletController.getOutletProductInventory
// );

// router.get(
//   "/warehouse/inventory/:warehouse_id/:product_id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//     UserRole.OUTLET_MANAGER,
//   ]),
//   outletController.getWarehouseProductInventory
// );

// router.get(
//   "/warehouse/inventory/:warehouse_id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//     UserRole.OUTLET_MANAGER,
//   ]),
//   outletController.getWarehouseInventory
// );
// router.get(
//   "/outlet/inventory/:outlet_id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//     UserRole.OUTLET_MANAGER,
//   ]),
//   outletController.getOutletInventory
// );

// router.get(
//   "/warehouse/search-product/:warehouse_id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//     UserRole.OUTLET_MANAGER,
//   ]),
//   outletController.searchProductOnWarehouse
// );
// router.get(
//   "/outlet/search-product/:outlet_id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//     UserRole.OUTLET_MANAGER,
//   ]),
//   outletController.searchProductOnInventory
// );

// // Protected routes
// router.post(
//   "/",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//   ]),
//   validateRequest(OutletValidationSchema.createZodSchema),
//   outletController.createOutlet
// );
// router.put(
//   "/:id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//   ]),
//   validateRequest(OutletValidationSchema.updateZodSchema),
//   outletController.updateOutlet
// );
// router.delete(
//   "/:id",
//   verifyToken([
//     UserRole.ADMIN,
//     UserRole.INVENTORY_MANAGER,
//     UserRole.SUPER_ADMIN,
//   ]),
//   validateRequest(OutletValidationSchema.deleteOutletZodSchema),
//   outletController.deleteOutlet
// );

// export const OutletsRoutes = router;
