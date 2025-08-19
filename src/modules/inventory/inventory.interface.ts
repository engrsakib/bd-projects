import { Types } from "mongoose";

export type IVariantCombination = {
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
  variants: IVariantCombination[];
};
