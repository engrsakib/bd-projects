import { Types } from "mongoose";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";
import { IRoles } from "@/constants/roles";

export interface IupdateLogs {
  name: string;
  role: IRoles;
  admin_note?: string;
  system_message?: string;
  date: Date;
}

export type IBarcode = {
  barcode: string;
  sku: string;

  variant: string | Types.ObjectId;
  product: string | Types.ObjectId;
  lot?: string | Types.ObjectId;
  stock?: string | Types.ObjectId;

  status: productBarcodeStatus;
  conditions?: productBarcodeCondition;

  is_used_barcode?: boolean;

  updated_logs?: IupdateLogs[];

  createdAt?: Date;
  updatedAt?: Date;
};
