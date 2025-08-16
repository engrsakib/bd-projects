import { Router } from "express";
import { UserController } from "./user.controller";
import validateRequest from "@/middlewares/validateRequest";
import { UserValidations } from "./user.validate";
import { otpValidations } from "../otp/otp.validate";
import { loginValidation } from "@/common/validators/login.validator";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { loggerMiddleware } from "@/middlewares/logger";
import { resetPasswordValidation } from "@/common/validators/reset-password-validator";
import { changePasswordValidation } from "@/common/validators/change-password-validator";

const router = Router();

router.post(
  "/",
  validateRequest(UserValidations.create),
  loggerMiddleware,
  UserController.create
);

router.post(
  "/verify",
  validateRequest(otpValidations.verifyOtp),
  loggerMiddleware,
  UserController.verifyAccount
);

router.post(
  "/resend-otp",
  validateRequest(otpValidations.resendOtp),
  loggerMiddleware,
  UserController.resendVerificationOtp
);

router.post(
  "/login",
  validateRequest(loginValidation),
  loggerMiddleware,
  UserController.login
);

router.get(
  "/auth",
  JwtInstance.authenticate([
    ROLES.VENDOR_OWNER,
    ROLES.VENDOR_ADMIN,
    ROLES.VENDOR_MANAGER,
    ROLES.VENDOR_STAFF,
    ROLES.VENDOR_ANALYST,
    ROLES.CUSTOMER,
    ROLES.SUBSCRIBER,
    ROLES.WHOLESALE_BUYER,
  ]),
  UserController.getLoggedInUser
);

router.patch(
  "/reset-password",
  validateRequest(resetPasswordValidation),
  UserController.resetPassword
);

router.patch(
  "/change-password",
  JwtInstance.authenticate([
    ROLES.VENDOR_OWNER,
    ROLES.VENDOR_ADMIN,
    ROLES.VENDOR_MANAGER,
    ROLES.VENDOR_STAFF,
    ROLES.VENDOR_ANALYST,
    ROLES.CUSTOMER,
    ROLES.SUBSCRIBER,
    ROLES.WHOLESALE_BUYER,
  ]),
  validateRequest(changePasswordValidation),
  UserController.changePassword
);

router.delete("/logout", UserController.logout);

export const UserRoutes = router;
