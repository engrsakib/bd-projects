import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";
import { inventoryFilterableFields } from "./inventory.constants";

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
}

export const InventoryController = new Controller();
