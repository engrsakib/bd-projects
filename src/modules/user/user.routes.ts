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
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  validateRequest(UserValidations.create),
  loggerMiddleware,
  UserController.create
);

router.patch(
  "/self",
  validateRequest(UserValidations.update),
  JwtInstance.authenticate(Object.values(ROLES)),
  // JwtInstance.hasPermissions(PermissionEnum.USER_UPDATE),
  UserController.updateSelf
);

router.get(
  "/auth",
  JwtInstance.authenticate(Object.values(ROLES)),
  UserController.getLoggedInUser
);

router.patch(
  "/:id",
  validateRequest(UserValidations.update),
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.USER_UPDATE),
  UserController.updateUser
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.USER_VIEW),
  UserController.getAllCustomers
);

router.get(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  UserController.getUserById
);

router.get(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.USER_VIEW),
  UserController.getUserById
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.USER_DELETE),
  UserController.deleteUser
);

router.post(
  "/create-user-by-admin",
  validateRequest(UserValidations.create),
  loggerMiddleware,
  UserController.createByAdmin
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

router.patch(
  "/reset-password",
  validateRequest(resetPasswordValidation),
  UserController.resetPassword
);

router.patch(
  "/change-password",
  JwtInstance.authenticate(Object.values(ROLES)),
  validateRequest(changePasswordValidation),
  UserController.changePassword
);

router.delete("/logout", UserController.logout);

export const UserRoutes = router;
