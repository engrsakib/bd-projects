import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { WebhocksService } from "./webhocks.service";

class Controller extends BaseController {
  steadfastWebhock = this.catchAsync(async (req: Request, res: Response) => {
    // Get Bearer token from header
    const authHeader = req.headers.authorization || "";
    const result = await WebhocksService.steadfastWebhock(req.body, authHeader);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: result.status === "success",
      message: result.message,
      data: result,
    });
  });
}

export const WebhocksController = new Controller();
