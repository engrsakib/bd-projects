import { Types } from "mongoose";
import { CATEGORY_STATUS_ENUM } from "./category.enums";

export type ICategory = {
  id: Types.ObjectId | string;
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  image: string;
  serial: number;
  status: CATEGORY_STATUS_ENUM;
  created_by: Types.ObjectId;
  subcategories: Types.ObjectId[];
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};
