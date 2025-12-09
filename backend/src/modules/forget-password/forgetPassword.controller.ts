import { Request, Response } from "express";
import { ForgetPasswordService } from "./forgetPassword.service";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  private readonly message =
    "We've sent a verification code to your phone number";
  adminForgetPassword = this.catchAsync(async (req: Request, res: Response) => {
    await ForgetPasswordService.adminForgetPassword(req.body.phone_number);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: this.message,
      data: null,
    });
  });

  userForgetPassword = this.catchAsync(async (req: Request, res: Response) => {
    await ForgetPasswordService.userForgetPassword(req.body.phone_number);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: this.message,
      data: null,
    });
  });
}

export const ForgetPasswordController = new Controller();
