import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { WebhocksService } from "./webhocks.service";

class Controller extends BaseController {
  steadfastWebhock = this.catchAsync(async (req: Request, res: Response) => {
    // Get Bearer token from header
    const authHeader = req.headers.authorization || "";

    console.log("webhook body", req.body, authHeader);

    const expectedToken = process.env.STEADFAST_WEBHOOK_TOKEN || "";
    console.log(authHeader, "authHeader");
    console.log(expectedToken, "expectedToken");

    // console.log(expectedToken, "token");
    // if (authHeader !== `Bearer${expectedToken}`) {
    //   console.log("Unauthorized webhook request");
    //   return res.status(HttpStatusCode.UNAUTHORIZED).json({
    //     status: "error",
    //     message: "Unauthorized webhook req request. contact support.",
    //   });
    // }

    const result = await WebhocksService.steadfastWebhock(req.body, authHeader);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: result.status ? "success" : "error",
      message: result.message,
    });
  });
}

export const WebhocksController = new Controller();
