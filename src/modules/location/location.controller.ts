import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { LocationService } from "./location.service";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    await LocationService.create(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: `Location with type ${req.body?.type || "warehouse"} created successfully`,
      data: null,
    });
  });
}

export const LocationController = new Controller();
