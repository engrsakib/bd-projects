import { Types } from "mongoose";
import { SUBCATEGORY_STATUS_ENUM } from "./subcategory.enums";

export type ISubcategory = {
  _id: Types.ObjectId | string;
  id: Types.ObjectId | string;
  name: string;
  image: string;
  description: string;
  serial: number;
  status: SUBCATEGORY_STATUS_ENUM;
  category: Types.ObjectId;
  slug: string;
  created_by: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};
