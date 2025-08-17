// import { Request, Response } from "express";
// import { IOutlet } from "./outlets.type";
// import { outletService } from "./outlets.service";
// import BaseController from "@/shared/baseController";

// export class OutletController extends BaseController {
//   createOutlet = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const outletData = req.body as IOutlet;

//       const outlet = await outletService.createOutlet(outletData);
//       //   console.log({ outlet });
//       return this.sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Outlet created successfully",
//         data: outlet,
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to create outlet",
//         error: error.message,
//       });
//     }
//   });

//   getAllWarehousesOutlets = this.catchAsync(
//     async (req: Request, res: Response) => {
//       try {
//         const { page, limit, search } = req.query as {
//           page?: string;
//           limit?: string;
//           search?: string;
//         };

//         const outlets = await outletService.getAllWarehousesOutlets({
//           page: Number(page) || 1,
//           limit: Number(limit) || 10,
//           search: search || "",
//         });

//         return this.sendResponse(res, {
//           statusCode: 200,
//           success: true,
//           data: outlets,
//           message: "All Outlets get successfully",
//         });
//       } catch (error: any) {
//         console.log(error);
//         return res.status(500).json({
//           statusCode: 500,
//           success: false,
//           message: "Failed to fetch outlets",
//           error: error.message,
//         });
//       }
//     }
//   );

//   getAllWarehouses = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const { page, limit, search } = req.query as {
//         page?: string;
//         limit?: string;
//         search?: string;
//       };

//       const outlets = await outletService.getAllWarehouses({
//         page: Number(page) || 1,
//         limit: Number(limit) || 10,
//         search: search || "",
//       });

//       return this.sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         data: outlets,
//         message: "All Outlets get successfully",
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to fetch outlets",
//         error: error.message,
//       });
//     }
//   });
//   getAllOutlets = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const { page, limit, search } = req.query as {
//         page?: string;
//         limit?: string;
//         search?: string;
//       };

//       const outlets = await outletService.getAllOutlets({
//         page: Number(page) || 1,
//         limit: Number(limit) || 10,
//         search: search || "",
//       });

//       return this.sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         data: outlets,
//         message: "All Outlets get successfully",
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to fetch outlets",
//         error: error.message,
//       });
//     }
//   });

//   getOutletById = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;
//       const outlet = await outletService.getOutletById(id);

//       if (!outlet) {
//         return res.status(404).json({
//           statusCode: 404,
//           success: false,
//           message: "Outlet not found",
//           data: null,
//         });
//       }

//       return this.sendResponse(res, {
//         data: outlet,
//         statusCode: 200,
//         success: true,
//         message: "Outlet fetched successfully",
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to fetch outlet",
//         error: error.message,
//       });
//     }
//   });

//   getOutletProductInventory = this.catchAsync(
//     async (req: Request, res: Response) => {
//       try {
//         const { outlet_id, product_id } = req.params;
//         const outlet = await outletService.getOutletProductInventory(
//           outlet_id,
//           product_id
//         );

//         console.log({ outlet_id, product_id, outlet });
//         return this.sendResponse(res, {
//           data: outlet,
//           statusCode: 200,
//           success: true,
//           message: "Outlet fetched successfully",
//         });
//       } catch (error: any) {
//         console.log(error);
//         return res.status(500).json({
//           statusCode: 500,
//           success: false,
//           message: "Failed to fetch outlet",
//           error: error.message,
//         });
//       }
//     }
//   );

//   getWarehouseProductInventory = this.catchAsync(
//     async (req: Request, res: Response) => {
//       try {
//         const { warehouse_id, product_id } = req.params;
//         const outlet = await outletService.getWarehouseProductInventory(
//           warehouse_id,
//           product_id
//         );

//         return this.sendResponse(res, {
//           data: outlet,
//           statusCode: 200,
//           success: true,
//           message: "Outlet fetched successfully",
//         });
//       } catch (error: any) {
//         console.log(error);
//         return res.status(500).json({
//           statusCode: 500,
//           success: false,
//           message: "Failed to fetch outlet",
//           error: error.message,
//         });
//       }
//     }
//   );

//   getOutletInventory = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const { outlet_id } = req.params;
//       const { page, limit, search } = req.query as {
//         page?: string;
//         limit?: string;
//         search?: string;
//       };
//       const outlet = await outletService.getOutletInventory(
//         { outlet_id },
//         {
//           page: Number(page) || 1,
//           limit: Number(limit) || 10,
//           search: search || "",
//         }
//       );

//       return this.sendResponse(res, {
//         data: outlet,
//         statusCode: 200,
//         success: true,
//         message: "Outlet fetched successfully",
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to fetch outlet",
//         error: error.message,
//       });
//     }
//   });

//   getWarehouseInventory = this.catchAsync(
//     async (req: Request, res: Response) => {
//       try {
//         const { warehouse_id } = req.params;
//         const { page, limit, search } = req.query as {
//           page?: string;
//           limit?: string;
//           search?: string;
//         };
//         const outlet = await outletService.getWarehouseInventory(
//           { warehouse_id },
//           {
//             page: Number(page) || 1,
//             limit: Number(limit) || 10,
//             search: search || "",
//           }
//         );

//         return this.sendResponse(res, {
//           data: outlet,
//           statusCode: 200,
//           success: true,
//           message: "Outlet fetched successfully",
//         });
//       } catch (error: any) {
//         console.log(error);
//         return res.status(500).json({
//           statusCode: 500,
//           success: false,
//           message: "Failed to fetch outlet",
//           error: error.message,
//         });
//       }
//     }
//   );
//   searchProductOnWarehouse = this.catchAsync(
//     async (req: Request, res: Response) => {
//       try {
//         const { warehouse_id } = req.params;
//         const { search } = req.query as {
//           search?: string;
//         };

//         const outlet = await outletService.searchProductOnWarehouse(
//           { warehouse_id },
//           {
//             search: search || "",
//           }
//         );

//         return this.sendResponse(res, {
//           data: outlet,
//           statusCode: 200,
//           success: true,
//           message: "Outlet fetched successfully",
//         });
//       } catch (error: any) {
//         console.log(error);
//         return res.status(500).json({
//           statusCode: 500,
//           success: false,
//           message: "Failed to fetch outlet",
//           error: error.message,
//         });
//       }
//     }
//   );

//   searchProductOnInventory = this.catchAsync(
//     async (req: Request, res: Response) => {
//       try {
//         const { outlet_id } = req.params;
//         const { search } = req.query as {
//           search?: string;
//         };
//         const outlet = await outletService.searchProductOnInventory(
//           { outlet_id },
//           {
//             search: search || "",
//           }
//         );

//         return this.sendResponse(res, {
//           data: outlet,
//           statusCode: 200,
//           success: true,
//           message: "Outlet fetched successfully",
//         });
//       } catch (error: any) {
//         console.log(error);
//         return res.status(500).json({
//           statusCode: 500,
//           success: false,
//           message: "Failed to fetch outlet",
//           error: error.message,
//         });
//       }
//     }
//   );

//   updateOutlet = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;
//       const outletData = req.body as Partial<IOutlet>;

//       const updatedOutlet = await outletService.updateOutlet(id, outletData);

//       if (!updatedOutlet) {
//         return { message: "Outlet not found", statusCode: 404 };
//       }

//       return this.sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Outlet updated successfully",
//         data: updatedOutlet,
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to update outlet",
//         error: error.message,
//       });
//     }
//   });

//   deleteOutlet = this.catchAsync(async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;
//       const deleted = await outletService.deleteOutlet(id);

//       if (!deleted) {
//         return { message: "Outlet not found", statusCode: 404 };
//       }

//       return this.sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Outlet deleted successfully",
//         data: deleted,
//       });
//     } catch (error: any) {
//       console.log(error);
//       return res.status(500).json({
//         statusCode: 500,
//         success: false,
//         message: "Failed to delete outlet",
//         error: error.message,
//       });
//     }
//   });
// }

// export const outletController = new OutletController();
