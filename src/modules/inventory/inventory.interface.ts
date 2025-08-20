import { Types } from "mongoose";

export type IVariant = {
  attribute_values: {
    [key: string]: string;
  };
  regular_price: number;
  sale_price: number;
  buying_price?: number;
  sku: string;
  available_quantity: number;
  total_sold: number;
  barcode: string;
  image?: string;
};

export type IInventory = {
  product: Types.ObjectId;
  location: Types.ObjectId;
  attributes: string[];
  variants: IVariant[];
};

export type IInventoryFilters = {
  product?: Types.ObjectId;
  location?: Types.ObjectId;
  attributes?: string;
  sku?: string;
  barcode?: string;
  regular_price_min?: number;
  regular_price_max?: number;
  sale_price_min?: number;
  sale_price_max?: number;
  available_quantity_min?: number;
  available_quantity_max?: number;
  total_sold_min?: number;
  total_sold_max?: number;
};

export const inventoryFilterableFields: string[] = [
  "product",
  "location",
  "attributes",
  "sku",
  "barcode",
  "attribute_values",
  "regular_price_min",
  "regular_price_max",
  "sale_price_min",
  "sale_price_max",
  "available_quantity_min",
  "available_quantity_max",
  "total_sold_min",
  "total_sold_max",
];
