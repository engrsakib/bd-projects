import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const zodPhoneNumberValidator = () =>
  z
    .string({ required_error: "Phone number is required" })
    .refine(
      (val) => {
        const phoneNumber = parsePhoneNumberFromString(val);
        return phoneNumber?.isValid() ?? false;
      },
      {
        message: "Invalid phone number. Please provide your valid phone number",
      }
    )
    .transform((val) => {
      const phoneNumber = parsePhoneNumberFromString(val);
      return phoneNumber ? phoneNumber.number : val;
    });
