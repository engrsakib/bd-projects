import { Document, Types } from "mongoose";
import { PURCHASE_STATUS_ENUM } from "./purchase.constants";

export type IPurchaseItem = {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  qty: number;
  unit_cost: number;
  discount: number;
  tax?: number;
  lot_number?: string;
  expiry_date?: Date;
};

export type IExpenseApplied = {
  type: string;
  amount: number;
  note?: string;
};

export type IPurchase = {
  _id: string;
  created_by: Types.ObjectId;
  received_by: Types.ObjectId;
  received_at: Date; // auto
  purchase_date: Date;
  location: Types.ObjectId;
  purchase_number: number; // incremental
  supplier: Types.ObjectId;
  total_cost?: number;
  items: IPurchaseItem[];
  expenses_applied?: IExpenseApplied[];
  attachments?: string[];
  additional_note?: string;
  status: PURCHASE_STATUS_ENUM;
  created_at: Date;
  updated_at: Date;
} & Document;

export type IPurchaseStatus = PURCHASE_STATUS_ENUM;

export type IPurchaseFilters = {
  supplier?: string;
  location?: string;
  sku?: string;
  status?: IPurchaseStatus;
  created_at_start_date?: string | Date;
  created_at_end_date?: string | Date;
  purchase_date_start?: string | Date;
  purchase_date_end?: string | Date;
  purchase_number?: string;
  received_at_start_date?: string | Date;
  received_at_end_date?: string | Date;
};
