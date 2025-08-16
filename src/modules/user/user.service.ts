import ApiError from "@/middlewares/error";
import { IUser, USER_STATUS } from "./user.interface";
import { UserModel } from "./user.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { BcryptInstance } from "@/lib/bcrypt";
import { OTPService } from "../otp/otp.service";
import { IOtpVerify } from "../otp/otp.interface";
import { Types } from "mongoose";
import JwtHelper from "@/helpers/jwtHelper";
import {
  IChangePassword,
  ILoginCredentials,
  IResetPassword,
} from "@/interfaces/common.interface";

class Service {
  async create(data: IUser) {
    const isExist = await UserModel.findOne({
      phone_number: data.phone_number,
    });

    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have '${isExist?.role}' account with this phone number. Please use a different phone number to create account or login`
      );
    }

    data.password = await BcryptInstance.hash(data.password);

    await UserModel.create(data);

    // send verification otp to SMS
    await OTPService.sendVerificationOtp(data.phone_number, "user");
  }

  async verifyAccount(data: IOtpVerify): Promise<{
    access_token: string;
    refresh_token: string;
    user: IUser;
  }> {
    const user = await UserModel.findOne({ phone_number: data.phone_number });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    // prevent already verified account
    if (user?.status === USER_STATUS.ACTIVE) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account already verified. Please login to your account"
      );
    }
    // verify otp
    await OTPService.verifyOTP(data);

    // update status to active
    await UserModel.findByIdAndUpdate(user._id, {
      status: USER_STATUS.ACTIVE,
      last_login_at: new Date(),
    });

    return this.generateLoginCredentials(user._id);
  }

  private async generateLoginCredentials(id: Types.ObjectId | string): Promise<{
    access_token: string;
    refresh_token: string;
    user: IUser;
  }> {
    const user = await UserModel.findById(id).select({
      password: 0,
    });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found");
    }

    const payload: any = {
      id: user?._id.toString(),
      phone_number: user?.phone_number as string,
      role: user?.role as string,
    };
    const { access_token, refresh_token } =
      await JwtHelper.generateTokens(payload);

    return {
      user: user,
      access_token,
      refresh_token,
    };
  }

  async resendVerificationOtp(phone_number: string) {
    const user = await UserModel.findOne({
      phone_number,
    });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    // prevent already verified account
    if (user?.status === USER_STATUS.ACTIVE) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account already verified. Please login to your account"
      );
    }

    // send verification sms with OTP
    await OTPService.sendVerificationOtp(phone_number, "user");
  }

  async login(data: ILoginCredentials): Promise<{
    access_token: string;
    refresh_token: string;
    user: IUser;
  }> {
    const user = await UserModel.findOne({
      phone_number: data.phone_number,
    });
    if (!user) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The account you are trying to login is not exist our system. Please create account first"
      );
    }

    if (user.status === USER_STATUS.INACTIVE) {
      // send a verification otp
      await OTPService.sendVerificationOtp(data.phone_number, "user");
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Your account is not verified yet. We've sent a verification otp. Please check SMS & verify to access your account"
      );
    }

    const isPasswordMatched = await BcryptInstance.compare(
      data.password,
      user.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Invalid credentials. Please try with valid credentials"
      );
    }

    await UserModel.findByIdAndUpdate(user._id, { last_login_at: new Date() });

    return await this.generateLoginCredentials(user._id);
  }

  async getLoggedInUser(id: string) {
    const user = await UserModel.findById(id).select({ password: 0 });

    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    return user;
  }

  async resetPassword(data: IResetPassword) {
    const user = await UserModel.findOne({ phone_number: data.phone_number });
    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    const newPassword = await BcryptInstance.hash(data.password);

    await UserModel.findByIdAndUpdate(user._id, { password: newPassword });
  }

  async changePassword(id: string, data: IChangePassword) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found!");
    }

    const isPasswordMatched = await BcryptInstance.compare(
      data.old_password,
      user.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your old password is wrong. Please provide your correct password"
      );
    }

    const isSamePassword = await BcryptInstance.compare(
      data.new_password,
      user.password
    );

    if (isSamePassword) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Same password couldn't be changed. Please provide a different password"
      );
    }

    const newPassword = await BcryptInstance.hash(data.new_password);

    await UserModel.findByIdAndUpdate(user._id, { password: newPassword });
  }
}

export const UserService = new Service();
