import { Types } from "mongoose";
import { ADMIN_ENUMS, IAdmin } from "./admin.interface";
import { AdminModel } from "./admin.model";
import { BcryptInstance } from "@/lib/bcrypt";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import JwtHelper from "@/helpers/jwtHelper";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import {
  IChangePassword,
  IJWtPayload,
  ILoginCredentials,
  IResetPassword,
} from "@/interfaces/common.interface";
import { OTPService } from "../otp/otp.service";
import { IOtpVerify } from "../otp/otp.interface";
import { SMSService } from "../sms/sms.service";

class Service {
  async create(data: IAdmin) {
    const isExist = await AdminModel.findOne({
      phone_number: data.phone_number,
    });

    if (isExist && !isExist.is_Deleted) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have an account with the phone number: ${data.phone_number}. Please login to your account`
      );
    }

    data.password = await BcryptInstance.hash(data.password);

    if (isExist && isExist.is_Deleted) {
      await AdminModel.findByIdAndUpdate(
        isExist._id,
        {
          ...data,
          is_Deleted: false,
        },
        { new: true }
      );
      await OTPService.sendVerificationOtp(data.phone_number, "admin");
      return;
    }

    await AdminModel.create(data);
    await OTPService.sendVerificationOtp(data.phone_number, "admin");
  }

  async createAdminByAdmin(data: IAdmin) {
    try {
      const isExist = await AdminModel.findOne({
        phone_number: data.phone_number,
      });

      if (isExist && !isExist.is_Deleted) {
        throw new ApiError(
          HttpStatusCode.CONFLICT,
          `You already have an account with the phone number: ${data.phone_number}. Please login to your account`
        );
      }

      data.status = ADMIN_ENUMS.ACTIVE;
      data.password = await BcryptInstance.hash(data.password);

      if (isExist && isExist.is_Deleted) {
        const admin = await AdminModel.findByIdAndUpdate(
          isExist._id,
          {
            ...data,
            is_Deleted: false,
          },
          { new: true }
        );
        return admin;
      }

      const admin = await AdminModel.create(data);
      return admin;
    } catch (error) {
      console.log(error, "createAdminByAdmin error");
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Something went wrong"
      );
    }
  }

  async adminLogin(data: ILoginCredentials): Promise<{
    access_token: string;
    refresh_token: string;
    user: IAdmin;
  }> {
    const admin = await AdminModel.findOne({ phone_number: data.phone_number });
    if (!admin) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The account you are trying to login is not exist our system. Please create an admin account first"
      );
    }

    if (admin.is_Deleted) {
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Your account has been deleted. Please contact support"
      );
    }

    const accountStatus = admin.status;

    if (accountStatus === ADMIN_ENUMS.INACTIVE) {
      // send a verification otp
      await OTPService.sendVerificationOtp(data.phone_number, "admin");
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Your account is not verified yet. We've sent a verification otp. Please check SMS & verify to access your account"
      );
    }

    if (accountStatus === ADMIN_ENUMS.ADMIN_APPROVAL) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account is not approved yet. Please wait until admin approve your account"
      );
    }

    const isPasswordMatched = await BcryptInstance.compare(
      data.password,
      admin.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Invalid credentials. Please try with valid credentials"
      );
    }

    return await this.generateLoginCredentials(admin._id);
  }

  private async generateLoginCredentials(id: Types.ObjectId): Promise<{
    access_token: string;
    refresh_token: string;
    user: IAdmin;
  }> {
    const admin = await AdminModel.findById(id).select({
      password: 0,
    });

    if (!admin) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The account you are trying to login is not exist our system. Please create an admin account first"
      );
    }

    const payload: IJWtPayload = {
      id: admin?._id.toString(),
      phone_number: admin?.phone_number as string,
      name: admin?.name as string,
      role: admin?.role as string,
    };
    const { access_token, refresh_token } =
      await JwtHelper.generateTokens(payload);

    return {
      user: admin,
      access_token,
      refresh_token,
    };
  }

  async resendVerificationOtp(phone_number: string) {
    const admin = await AdminModel.findOne({
      phone_number,
    });
    if (!admin) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The account you are trying to login is not exist our system. Please create an admin account first"
      );
    }

    // prevent already verified account
    if (admin?.status !== ADMIN_ENUMS.INACTIVE) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account already verified. Please login to your account"
      );
    }

    // send verification sms with OTP
    await OTPService.sendVerificationOtp(phone_number, "admin");
  }

  async verifyAccount(data: IOtpVerify) {
    const admin = await AdminModel.findOne({ phone_number: data.phone_number });
    if (!admin) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The account you are trying to login is not exist our system. Please create an admin account first"
      );
    }

    if (admin?.status === "active") {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account is already verified. Please login to your account"
      );
    } else if (admin?.status === "admin_approval") {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your account is under admin approval. Please wait until you account approved"
      );
    }

    // verify otp here
    await OTPService.verifyOTP(data);

    await AdminModel.updateOne(
      { phone_number: data.phone_number },
      { status: ADMIN_ENUMS.ADMIN_APPROVAL }
    );

    return await this.generateLoginCredentials(admin._id);
  }

  async approveAdminAccount(phone_number: string) {
    const isExist = await AdminModel.findOne({ phone_number });
    if (!isExist) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "The admin account was not found!"
      );
    }

    if (isExist.status === ADMIN_ENUMS.ACTIVE) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "The admin account already approved and activated"
      );
    }

    await AdminModel.updateOne(
      { phone_number },
      { status: ADMIN_ENUMS.ACTIVE }
    );

    // send approval sms
    await SMSService.sendGeneralMessage(
      phone_number,
      "Your Cloudy BD account has been approved. Now, you can login and access your account"
    );
  }

  async getLoggedInAdmin(id: string) {
    const data = await AdminModel.findById(id)
      .select("-password")
      .populate({
        path: "permissions",
        select: "key",
      })
      .lean();

    if (!data) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin was not found");
    }

    let keys: string[] = [];

    if (
      data.permissions &&
      typeof data.permissions === "object" &&
      "key" in data.permissions
    ) {
      keys = (data.permissions as { key: string[] }).key;
    }

    return { ...data, permissions: keys };
  }

  async getAllAdmins(options: IPaginationOptions, search_query: string) {
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

    const result = await AdminModel.find(searchCondition)
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

    const total = await AdminModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data,
    };
  }

  async getAdminById(id: string) {
    const data = await AdminModel.findById(id)
      .select({ password: 0 })
      .populate({
        path: "permissions",
        select: "key",
      })
      .lean();

    if (!data) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin was not found");
    }

    let keys: string[] = [];

    if (
      data.permissions &&
      typeof data.permissions === "object" &&
      "key" in data.permissions
    ) {
      keys = (data.permissions as { key: string[] }).key;
    }

    return { ...data, permissions: keys };
  }

  async updateAdmin(id: string, data: Partial<IAdmin>) {
    if (!id) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Admin ID is required");
    }
    const duplicatePhone = await AdminModel.findOne({
      phone_number: data.phone_number,
      _id: { $ne: id },
    });
    if (duplicatePhone) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `You already have an account with the phone number: ${data.phone_number}. Please use a different phone number`
      );
    }

    const isExist = await AdminModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin was not found");
    }

    if ("password" in data) {
      if (data.password && data.password.length > 0 && data.password.trim()) {
        data.password = await BcryptInstance.hash(data.password);
      } else {
        delete data.password;
      }
    }

    return await AdminModel.findByIdAndUpdate(id, { ...data }, { new: true });
  }

  async changePassword(id: string, payload: IChangePassword) {
    const isExist = await AdminModel.findById(id);

    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin was not found");
    }

    const isPasswordMatched = await BcryptInstance.compare(
      payload.old_password,
      isExist.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Old password is incorrect. Please provide the correct old password"
      );
    }

    const isUnchangedPassword = await BcryptInstance.compare(
      payload.new_password,
      isExist.password
    );

    if (isUnchangedPassword) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your provided old and new passwords are same. Please provide a different new password"
      );
    }

    const newPassword = await BcryptInstance.hash(payload?.new_password);

    await AdminModel.findByIdAndUpdate(id, {
      password: newPassword,
    });
  }

  async resetPassword(data: IResetPassword) {
    const isExist = await AdminModel.findOne({
      phone_number: data.phone_number,
    });
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin was not found!");
    }

    const newPassword = await BcryptInstance.hash(data.password);
    await AdminModel.findByIdAndUpdate(isExist._id, {
      password: newPassword,
    });
  }

  async deleteAdmin(id: string) {
    const isExist = await AdminModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin was not found");
    }
    return await AdminModel.findByIdAndUpdate(id, { is_Deleted: true });
  }
}

export const AdminService = new Service();
