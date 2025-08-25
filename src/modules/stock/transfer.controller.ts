import { Request, Response } from "express";
import { TransferService } from "./transfer.service";
import BaseController from "@/shared/baseController";

export class TransferInventoryController extends BaseController {
  getAllTransferInventory = this.catchAsync(
    async (req: Request, res: Response) => {
      const { page, limit, endDate, startDate, outletId, warehouseId } =
        req.query as {
          page?: string;
          limit?: string;
          startDate?: string;
          endDate?: string;
          outletId?: string;
          warehouseId?: string;
        };

      const transferInventory = await TransferService.getAllTransferInventory({
        page: Number(page || 1),
        limit: Number(limit || 10),
        endDate,
        startDate,
        outletId,
        warehouseId,
      });
      return this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Inventory added successfully",
        data: transferInventory,
      });
    }
  );

  getTransferInventoryById = this.catchAsync(
    async (req: Request, res: Response) => {
      try {
        const { inventory_transfer_history_id } = req.params;
        const transferInventory =
          await TransferService.getTransferInventoryById(
            inventory_transfer_history_id
          );
        return this.sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Inventory added successfully",
          data: transferInventory,
        });
      } catch (error: any) {
        console.log(error);
      }
    }
  );
}

export const transferInventoryController = new TransferInventoryController();
