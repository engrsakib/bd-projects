import { Types, Document } from "mongoose";

export type IVariant = {
  _id: Types.ObjectId;
  attributes: string[];
  attribute_values: {
    [key: string]: string;
  };
  regular_price: number;
  sale_price: number;
  sku: string;
  barcode: string;
  image?: string;
  product: Types.ObjectId;
} & Document;
