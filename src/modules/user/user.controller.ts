import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { UserService } from "./user.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import { cookieManager } from "@/shared/cookie";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    await UserService.create(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message:
        "Your account has been created successfully. We've sent a verification code (SMS) to you phone number. Please verify to access your account",
    });
  });

  createByAdmin = this.catchAsync(async (req: Request, res: Response) => {
    await UserService.createByAdmin(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "User account has been created successfully",
    });
  });

  getAllCustomers = this.catchAsync(async (req: Request, res: Response) => {
    const options = req.query;
    // console.log(options);

    const data = await UserService.getAllCustomers(
      options,
      req.query.search_query as string
    );
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All customers retrieved successfully",
      data: data,
    });
  });

  getUserById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = await UserService.getUserById(id);
    if (!data) {
      // Not found or deleted
      return this.sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "user not found",
        data: null,
      });
    } else if (data.is_Deleted) {
      return this.sendResponse(res, {
        statusCode: 410,
        success: false,
        message: "user has been deleted",
        data: null,
      });
    }

    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "user retrieved successfully",
      data: data,
    });
  });

  verifyAccount = this.catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.verifyAccount(req.body);
    // store tokens on cookie
    // cookieManager.setTokens(res, access_token, refresh_token);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Your account has been verified and logged in successfully",
      data: result,
    });
  });

  resendVerificationOtp = this.catchAsync(
    async (req: Request, res: Response) => {
      await UserService.resendVerificationOtp(req.body.phone_number);
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message:
          " We've sent a verification code (SMS) to you phone number. Please verify to access your account",
        data: null,
      });
    }
  );

  login = this.catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.login(req.body);
    // store tokens on cookie
    // cookieManager.setTokens(res, access_token, refresh_token);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "You've logged in successfully",
      data: result,
    });
  });

  getLoggedInUser = this.catchAsync(async (req: Request, res: Response) => {
    console.log(req.user.id);
    const user = await UserService.getLoggedInUser(req?.user?.id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Authenticated user retrieved successfully",
      data: user,
    });
  });

  resetPassword = this.catchAsync(async (req: Request, res: Response) => {
    await UserService.resetPassword(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message:
        "Your password has been reset successfully. Please login to your account",
      data: null,
    });
  });

  changePassword = this.catchAsync(async (req: Request, res: Response) => {
    await UserService.changePassword(req?.user?.id, req.body);
    cookieManager.clearTokens(res);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Your password has been changed. Please login to your account",
      data: null,
    });
  });

  updateUser = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const data = await UserService.updateUser(id, req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User updated successfully",
      data: data,
    });
  });

  updateSelf = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.user.id;
    const data = await UserService.updateUser(id, req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User updated successfully",
      data: data,
    });
  });

  logout = this.catchAsync(async (req: Request, res: Response) => {
    cookieManager.clearTokens(res);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Your have logged out",
      data: null,
    });
  });

  deleteUser = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await UserService.deleteUser(id);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  });
}

export const UserController = new Controller();
