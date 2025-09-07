import { Types } from "mongoose";

export type IBanner = {
  thumbnail: string;
  products: Types.ObjectId[];
  type: "normal" | "featured";
};
