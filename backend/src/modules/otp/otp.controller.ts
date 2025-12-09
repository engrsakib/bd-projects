import { Request, Response } from "express";
import { OTPService } from "./otp.service";
import BaseController from "@/shared/baseController";

class Controller extends BaseController {
  verifyOTP = this.catchAsync(async (req: Request, res: Response) => {
    await OTPService.verifyOTP(req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Your OTP verification has been successful. Now, you can login and access to your account",
      data: null,
    });
  });
}

export const OTPController = new Controller();
