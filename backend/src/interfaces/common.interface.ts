import { IRoles } from "@/constants/roles";
import { Types } from "mongoose";

export type IJWtPayload = {
  id: string | Types.ObjectId;
  phone_number: string;
  name?: string;
  role: IRoles;
};

export type IChangePassword = {
  old_password: string;
  new_password: string;
};

export type ILoginCredentials = {
  phone_number: string;
  password: string;
};

export type IResetPassword = {
  phone_number: string;
  password: string;
};

export type IAddress = {
  division?: string;
  district?: string;
  thana?: string;
  zip_code?: string;
  local_address?: string;
};

export interface IOrderItem {
  product: string | Types.ObjectId;
  variant: string | Types.ObjectId;
  quantity: number;
  attributes?: {
    [key: string]: string;
  };
}

export interface OrderQuery {
  page?: string;
  limit?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  phone?: string;
  orders_by?: string;
  sku?: string;
  order_id?: string;
  parcel_id?: number;
}
