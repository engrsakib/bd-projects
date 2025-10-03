import { Types } from "mongoose";

export type IUser = {
  _id: Types.ObjectId | string;
  name: string;
  phone_number: string;
  is_Deleted: boolean;
  image: string;
  email: string;
  role: string;
  password: string;
  status: "inactive" | "active";
  last_login_at: Date;
};

export enum USER_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
