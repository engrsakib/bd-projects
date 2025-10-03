import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import { cookieManager } from "@/shared/cookie";

class Controller extends BaseController {
  createAdmin = this.catchAsync(async (req: Request, res: Response) => {
    await AdminService.create(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message:
        "Your admin account has been created. We've sent a verification OTP to your phone number. Please check your phone and verify your account",
      data: null,
    });
  });

  createAdminByAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const admin = await AdminService.createAdminByAdmin(req.body);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Your admin account has been created successfully.",
      data: admin,
    });
  });

  verifyAccount = this.catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.verifyAccount(req.body);
    // cookieManager.setTokens(res, access_token, refresh_token);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message:
        "Your account has been verified successfully. Please wait until admin approve your account",
      data: result,
    });
  });

  resendVerificationOtp = this.catchAsync(
    async (req: Request, res: Response) => {
      const data = await AdminService.resendVerificationOtp(
        req.body.phone_number
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message:
          "We've sent a verification otp. Please check SMS & verify to access your account",
        data,
      });
    }
  );

  approveAdminAccount = this.catchAsync(async (req: Request, res: Response) => {
    const { phone_number } = req.body;
    await AdminService.approveAdminAccount(phone_number);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "The admin account has been activated successfully.",
      data: null,
    });
  });

  adminLogin = this.catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.adminLogin(req.body);
    // cookieManager.setTokens(res, access_token, refresh_token);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "You've logged in successfully.",
      data: result,
    });
  });

  getLoggedInAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.getLoggedInAdmin(req.user?.id as string);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Admin retrieved successfully.",
      data,
    });
  });

  getAllAdmins = this.catchAsync(async (req: Request, res: Response) => {
    const options = req.query;
    // console.log(options);

    const data = await AdminService.getAllAdmins(
      options,
      req.query.search_query as string
    );
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admins retrieved successfully",
      data: data,
    });
  });

  getAdminById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = await AdminService.getAdminById(id);
    if (!data) {
      // Not found or deleted
      return this.sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Admin not found",
        data: null,
      });
    } else if (data.is_Deleted) {
      return this.sendResponse(res, {
        statusCode: 410,
        success: false,
        message: "Admin has been deleted",
        data: null,
      });
    }

    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin retrieved successfully",
      data: data,
    });
  });

  updateAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = await AdminService.updateAdmin(id, req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin updated successfully",
      data: data,
    });
  });

  changePassword = this.catchAsync(async (req: Request, res: Response) => {
    const id = req?.user?.id;
    await AdminService.changePassword(id, req.body);
    cookieManager.clearTokens(res);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Your password has been changed successfully",
      data: null,
    });
  });

  resetPassword = this.catchAsync(async (req: Request, res: Response) => {
    console.log("Reset password");
    await AdminService.resetPassword(req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Your password has been reset successfully",
      data: null,
    });
  });

  logout = this.catchAsync(async (req: Request, res: Response) => {
    cookieManager.clearTokens(res);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logged out successfully!",
      data: null,
    });
  });

  deleteAdmin = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await AdminService.deleteAdmin(id);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin deleted successfully",
      data: null,
    });
  });
}

export const AdminController = new Controller();
