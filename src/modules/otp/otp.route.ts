import { Router } from "express";
import { OTPController } from "./otp.controller";
import { otpValidations } from "./otp.validate";
import validateRequest from "@/middlewares/validateRequest";
import { loggerMiddleware } from "@/middlewares/logger";

const router = Router();

router.post(
  "/verify",
  validateRequest(otpValidations.verifyOtp),
  loggerMiddleware,
  OTPController.verifyOTP
);

export const OTPRoutes = router;
