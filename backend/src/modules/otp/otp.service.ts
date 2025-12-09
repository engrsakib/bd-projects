import ApiError from "@/middlewares/error";
import { ADMIN_ENUMS } from "../admin/admin.interface";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IRoles } from "@/constants/roles";
import { SMSService } from "../sms/sms.service";
import { OTPModel } from "./otp.model";
import { IOtpVerify } from "./otp.interface";
import { AdminModel } from "../admin/admin.model";

class Service {
  async sendVerificationOtp(phone_number: string, account_type: IRoles) {
    const isExist = await OTPModel.findOne({ phone_number });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "We've already sent an OTP to your inbox. Please check sms and verify your account"
      );
    }

    if (account_type === "admin") {
      const admin = await AdminModel.findOne({ phone_number });
      if (!admin) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          "Admin account was to found to send otp"
        );
      }
      if (admin.status === ADMIN_ENUMS.ACTIVE) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Your account already activated"
        );
      }
      if (admin.status === ADMIN_ENUMS.ADMIN_APPROVAL) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Your account already verified and still under approval stage. Please wait until your account approved and activated"
        );
      }
    }

    const otp = await this.generateOtp();
    await OTPModel.create({ phone_number, otp });

    // send sms to verify account
    await SMSService.sendOtp(phone_number, otp);
  }

  async verifyOTP(data: IOtpVerify) {
    const otpRecord = await OTPModel.findOne({
      phone_number: data.phone_number,
    });

    if (!otpRecord) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Your otp verification time has been expired. Please resend otp"
      );
    }

    if (otpRecord?.otp !== data.otp) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Your provided otp was wrong. Please try with correct otp"
      );
    }
  }

  async sendForgetPasswordOtp(phone_number: string) {
    const isExist = await OTPModel.findOne({ phone_number });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "We've already sent an OTP to your inbox. Please check sms and verify your account"
      );
    }

    // generate otp
    const otp = await this.generateOtp();
    await OTPModel.create({ phone_number, otp });

    // send sms
    await SMSService.sendOtp(phone_number, otp);
  }

  private async generateOtp(): Promise<number> {
    return Math.floor(100000 + Math.random() * 900000);
  }
}

export const OTPService = new Service();
