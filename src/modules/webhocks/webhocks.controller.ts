import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { WebhocksService } from "./webhocks.service";

class Controller extends BaseController {
  steadfastWebhock = this.catchAsync(async (req: Request, res: Response) => {
    const result = await WebhocksService.steadfastWebhock(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Steadfast webhock executed successfully",
      data: result,
    });
  });
}

export const WebhocksController = new Controller();
