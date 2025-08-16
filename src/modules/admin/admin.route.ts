import { Router } from "express";
import { AdminController } from "./admin.controller";
import { adminValidations } from "./admin.validate";
import { otpValidations } from "../otp/otp.validate";
import validateRequest from "@/middlewares/validateRequest";
import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";
import { loggerMiddleware } from "@/middlewares/logger";
import { loginValidation } from "@/common/validators/login.validator";
import { changePasswordValidation } from "@/common/validators/change-password-validator";
import { resetPasswordValidation } from "@/common/validators/reset-password-validator";

const router = Router();

router.post(
  "/",
  validateRequest(adminValidations.create),
  loggerMiddleware,
  AdminController.createAdmin
);

router.post(
  "/login",
  validateRequest(loginValidation),
  loggerMiddleware,
  AdminController.adminLogin
);

router.post(
  "/verify",
  validateRequest(otpValidations.verifyOtp),
  loggerMiddleware,
  AdminController.verifyAccount
);

router.post(
  "/resend-otp",
  validateRequest(otpValidations.resendOtp),
  loggerMiddleware,
  AdminController.resendVerificationOtp
);

router.post(
  "/approve",
  validateRequest(adminValidations.approveAccount),
  loggerMiddleware,
  AdminController.approveAdminAccount
);

router.get(
  "/auth",
  JwtInstance.authenticate([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SUPPORT_STAFF,
    ROLES.CONTENT_MANAGER,
    ROLES.ACCOUNT_MANAGER,
    ROLES.LOGISTICS_MANAGER,
  ]),
  AdminController.getLoggedInAdmin
);

router.get(
  "/",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  AdminController.getAllAdmins
);

router.get(
  "/:id",
  JwtInstance.authenticate([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  AdminController.getAdminById
);

router.patch(
  "/change-password",
  JwtInstance.authenticate([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SUPPORT_STAFF,
    ROLES.CONTENT_MANAGER,
    ROLES.ACCOUNT_MANAGER,
    ROLES.LOGISTICS_MANAGER,
  ]),
  validateRequest(changePasswordValidation),
  loggerMiddleware,
  AdminController.changePassword
);

router.patch(
  "/reset-password",
  validateRequest(resetPasswordValidation),
  loggerMiddleware,
  AdminController.resetPassword
);

router.patch(
  "/:id",
  JwtInstance.authenticate([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SUPPORT_STAFF,
    ROLES.CONTENT_MANAGER,
    ROLES.ACCOUNT_MANAGER,
    ROLES.LOGISTICS_MANAGER,
  ]),
  validateRequest(adminValidations.update),
  loggerMiddleware,
  AdminController.updateAdmin
);

router.delete("/logout", AdminController.logout);

export const AdminRoutes = router;
