import { Types } from "mongoose";

export type IAdmin = {
  name: string;
  phone_number: string;
  role: string;
  is_Deleted: boolean;
  image: string;
  status: "inactive" | "admin_approval" | "active";
  permissions?: Types.ObjectId;
  password: string;
  designation?: string;
  bio?: string;
};

export enum ADMIN_ENUMS {
  INACTIVE = "inactive",
  ACTIVE = "active",
  ADMIN_APPROVAL = "admin_approval",
}
