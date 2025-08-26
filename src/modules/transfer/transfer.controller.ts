import { paginationFields } from "@/constants/paginationFields";
import BaseController from "@/shared/baseController";
import pickQueries from "@/shared/pickQueries";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { TransferService } from "./transfer.service";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  getByLocation = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const location = req.params.location as unknown as Types.ObjectId;

    const transfer = await TransferService.getByLocation(options, location);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      data: transfer,
      message: "Transfers by location retrieved successfully",
    });
  });

  getAllTransfers = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const { from, to } = req.query as { from: string; to: string };

    const transfer = await TransferService.getAllTransfers(options, {
      from,
      to,
    });

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      data: transfer,
      message: "All transfers retrieved successfully",
    });
  });
}

export const TransferController = new Controller();
