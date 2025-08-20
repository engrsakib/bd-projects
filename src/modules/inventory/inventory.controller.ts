import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";
import { inventoryFilterableFields } from "./inventory.constants";
import { Types } from "mongoose";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    await InventoryService.create(req.body);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Inventory created successfully",
      data: null,
    });
  });

  getAllInventories = this.catchAsync(async (req: Request, res: Response) => {
    const pagination = pickQueries(req.query, paginationFields);
    const filters = pickQueries(req.query, inventoryFilterableFields);
    const result = await InventoryService.getAllInventories(
      pagination,
      filters
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Inventories retrieved successfully",
      data: result,
    });
  });

  getInventoriesByProduct = this.catchAsync(
    async (req: Request, res: Response) => {
      const product_id = req.params.product_id as unknown as Types.ObjectId;
      const result = await InventoryService.getInventoriesByProduct(product_id);
      this.sendResponse(res, {
        statusCode:
          result?.length > 0 ? HttpStatusCode.OK : HttpStatusCode.NOT_FOUND,
        success: result?.length > 0 ? true : false,
        message:
          result?.length > 0
            ? "Inventories retrieved successfully"
            : "This product han no inventories",
        data: result,
      });
    }
  );

  getInventoriesByLocation = this.catchAsync(
    async (req: Request, res: Response) => {
      const location_id = req.params.location_id as unknown as Types.ObjectId;
      const result =
        await InventoryService.getInventoriesByLocation(location_id);
      this.sendResponse(res, {
        statusCode:
          result?.length > 0 ? HttpStatusCode.OK : HttpStatusCode.NOT_FOUND,
        success: result?.length > 0 ? true : false,
        message:
          result?.length > 0
            ? "Inventories retrieved successfully"
            : "This location han no inventories",
        data: result,
      });
    }
  );

  updateInventory = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const result = await InventoryService.updateInventory(id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Inventory updated successfully",
      data: result,
    });
  });

  addVariant = this.catchAsync(async (req: Request, res: Response) => {
    const inventory_id = req.params.inventory_id as unknown as Types.ObjectId;
    await InventoryService.addVariant(inventory_id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variant added to the inventory successfully",
      data: null,
    });
  });

  updateVariant = this.catchAsync(async (req: Request, res: Response) => {
    const variant_id = req.params.variant_id as unknown as Types.ObjectId;
    await InventoryService.updateVariant(variant_id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variant updated successfully",
      data: null,
    });
  });
}

export const InventoryController = new Controller();
