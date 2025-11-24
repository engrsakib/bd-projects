import { Types } from "mongoose";

export type IBarcode = {
  barcode: string;
  sku: string;

  variant: string | Types.ObjectId;
  product: string | Types.ObjectId;
  lot?: string | Types.ObjectId;
  stock?: string | Types.ObjectId;
};
