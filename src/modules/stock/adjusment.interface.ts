import { Model, Schema, Types } from "mongoose";
import { IStock } from "./stock.interface";
import { ILot } from "../lot/lot.interface";

export interface IVariantCombination {
  attribute_values: {
    [key: string]: string;
  };
  sku: string;
  regular_price: number;
  sale_price: number;
  barcode: string;
  image?: string; // optional: image for this variant
  _id?: Types.ObjectId;
}

export interface IAdjustProduct {
  product: Types.ObjectId;
  quantity: number;
  selected_variant: IVariantCombination;
  unit_price: number;
  total_price: number; // quantity * quantity
  product_note?: string;
  stock: Types.ObjectId;
}

export type IAdjustStocks = {
  _id?: Schema.Types.ObjectId;
  adjust_by: Types.ObjectId;
  products: IAdjustProduct[];
  activities_date: Date;
  action?: string;
  total_amount: number;
  note?: string;
} & Document;

export interface IAdjustStocksModel extends Model<IAdjustStocks> {}
export interface IStocksModel extends Model<IStock> {}
export interface ILotsModel extends Model<ILot> {}

export interface ProductFilters {
  product?: string;
  stock?: string;
  sku?: string;
  barcode?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
  attribute_values?: Record<string, string>;
  product_note?: string;
}

export interface Filters {
  business_location?: string;
  action?: "ADDITION" | "DEDUCTION";
  adjust_by?: string;
  minTotalAmount?: number;
  maxTotalAmount?: number;
  startDate?: string | Date; // activities_date start
  endDate?: string | Date; // activities_date end
  products?: ProductFilters;
}

export interface StocksAdjustmentQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string; // e.g. "activities_date" or "total_amount"
  order?: "asc" | "desc";
  search?: string;
  filters?: Filters;
}
