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
import { emitter } from "@/events/eventEmitter";
import { ROLES } from "@/constants/roles";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";

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

    const result = await UserModel.create(data);

    // send verification otp to SMS
    await OTPService.sendVerificationOtp(data.phone_number, "user");

    // fire event to create cart if role === "customer"
    if (data.role === ROLES.CUSTOMER) {
      emitter.emit("user.registered", result._id);
    }
  }
  async createByAdmin(data: IUser) {
    const isExist = await UserModel.findOne({
      phone_number: data.phone_number,
    });

    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have '${isExist?.role}' account with this phone number. Please use a different phone number to create account or login`
      );
    }
    data.status = await USER_STATUS.ACTIVE;
    data.password = await BcryptInstance.hash(data.password);

    const result = await UserModel.create(data);

    // send verification otp to SMS
    // await OTPService.sendVerificationOtp(data.phone_number, "user");

    // fire event to create cart if role === "customer"
    if (data.role === ROLES.CUSTOMER) {
      emitter.emit("user.registered", result._id);
    }
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

  async getAllCustomers(options: IPaginationOptions, search_query: string) {
    const {
      limit = 5,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const role = options.role;

    const searchCondition: any = { is_Deleted: false };

    if (role !== undefined && role !== null && role !== "") {
      searchCondition.role = role;
    }

    if (search_query) {
      searchCondition.$or = [
        { name: { $regex: search_query, $options: "i" } },
        { email: { $regex: search_query, $options: "i" } },
        { designation: { $regex: search_query, $options: "i" } },
        { phone_number: { $regex: search_query, $options: "i" } },
      ];
    }

    const result = await UserModel.find(searchCondition)
      .select({ password: 0 })
      .populate({
        path: "permissions",
        select: "key -_id",
      })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!result) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admins not found");
    }

    const data = result.map((admin: any) => {
      let keys: string[] = [];
      if (
        admin.permissions &&
        typeof admin.permissions === "object" &&
        "key" in admin.permissions
      ) {
        keys = (admin.permissions as { key: string[] }).key;
      }
      return { ...admin, permissions: keys };
    });

    const total = await UserModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data,
    };
  }

  async getUserById(id: string) {
    const data = await UserModel.findById(id).select({ password: 0 }).lean();

    if (!data) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "user was not found");
    }
    if (data.is_Deleted) {
      throw new ApiError(HttpStatusCode.GONE, "user has been deleted");
    }

    // remove password from data
    data.password = undefined as any;

    return { ...data };
  }

  async updateUser(id: string, data: Partial<IUser>) {
    if (!id) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "User ID is required");
    }
    const duplicatePhone = await UserModel.findOne({
      phone_number: data.phone_number,
      _id: { $ne: id },
    });
    if (duplicatePhone) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have an account with the phone number: ${data.phone_number}. Please use a different phone number`
      );
    }

    const isExist = await UserModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found");
    }
    return await UserModel.findByIdAndUpdate(id, { ...data });
  }

  async deleteUser(id: string) {
    const isExist = await UserModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User was not found");
    }
    return await UserModel.findByIdAndUpdate(id, { is_Deleted: true });
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
