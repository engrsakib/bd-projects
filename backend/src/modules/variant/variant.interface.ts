import { Types, Document } from "mongoose";

export interface IVariant extends Document {
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
  default_purchase?: Types.ObjectId;
}

export interface IUpdateVariantByProduct {
  variants: IVariant[];
  attributes?: string[];
}
