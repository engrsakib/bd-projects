import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import { HttpStatusCode } from "@/lib/httpStatus";

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
}

export const InventoryController = new Controller();
