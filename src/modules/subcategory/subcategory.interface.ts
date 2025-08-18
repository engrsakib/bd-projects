import { Types } from "mongoose";

export type ISubcategory = {
  _id: Types.ObjectId | string;
  id: Types.ObjectId | string;
  name: string;
  image: string;
  description: string;
  serial: number;
  category: Types.ObjectId;
  slug: string;
  created_by: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};
