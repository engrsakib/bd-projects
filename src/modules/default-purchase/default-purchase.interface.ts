import { Document, Types } from "mongoose";

/**
 * Interface for DefaultsPurchase document based on the provided Mongoose schema.
 */
export interface IDefaultsPurchase extends Document {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  supplier?: Types.ObjectId | null;
  unit_cost: number;
  discount?: number;
  tax?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DefaultsPurchaseQuery = {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
  product?: string;
  variant?: string;
  supplier?: string;
};
