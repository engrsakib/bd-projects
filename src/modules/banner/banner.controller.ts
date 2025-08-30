import BaseController from "@/shared/baseController";
import { BannerService } from "./banner.service";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const result = await BannerService.create(data);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Banner created successfully",
      data: result,
    });
  });
}

export const BannerController = new Controller();
