import { Types } from "mongoose";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";
import { IRoles } from "@/constants/roles";

export interface updateBy {
  name: string;
  role: IRoles;
}

export type IBarcode = {
  barcode: string;
  sku: string;

  variant: string | Types.ObjectId;
  product: string | Types.ObjectId;
  lot?: string | Types.ObjectId;
  stock?: string | Types.ObjectId;

  status: productBarcodeStatus[];
  conditions?: productBarcodeCondition[];
  reason?: string;

  is_used_barcode?: boolean;

  updated_by?: updateBy[];

  createdAt?: Date;
  updatedAt?: Date;
};
