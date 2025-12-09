import { Types } from "mongoose";

export type IStock = {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  location: Types.ObjectId;
  available_quantity: number;
  total_sold?: number;
  qty_reserved: number; // cart/reservation (optional)
};

export type IStockFilters = {
  location?: string;
  product?: string;
  variant?: string;
  threshold?: number;
  category?: string;
  subcategory?: string;
  sku?: string;
  search_query?: string;
  min_qty?: number;
  max_qty?: number;
};

export const stockFilterableFields = [
  "location",
  "product",
  "variant",
  "category",
  "subcategory",
  "sku",
  "search_query",
  "min_qty",
  "max_qty",
  "threshold",
];

export interface IStockReportQuery {
  sku?: string;
  threshold?: number;
  page?: number;
  limit?: number;
}
