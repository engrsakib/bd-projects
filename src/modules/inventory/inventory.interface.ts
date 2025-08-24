import { Types } from "mongoose";

export type IInventory = {
  product: Types.ObjectId;
  location: Types.ObjectId;
  variants: Types.ObjectId[];
};

export type IInventoryFilters = {
  product?: Types.ObjectId;
  location?: Types.ObjectId;
};
