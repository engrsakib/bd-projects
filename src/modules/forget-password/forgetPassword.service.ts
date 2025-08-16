import ApiError from "@/middlewares/error";
import { AdminModel } from "../admin/admin.model";
import { UserModel } from "../user/user.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { OTPService } from "../otp/otp.service";

class Service {
  async adminForgetPassword(phone_number: string) {
    const admin = await AdminModel.findOne({ phone_number });
    if (!admin) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Your account was not found!"
      );
    }
    await OTPService.sendForgetPasswordOtp(admin.phone_number);
  }

  async userForgetPassword(phone_number: string) {
    const user = await UserModel.findOne({ phone_number });
    if (!user) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Your account was not found!"
      );
    }
    await OTPService.sendForgetPasswordOtp(user.phone_number);
  }
}

export const ForgetPasswordService = new Service();
