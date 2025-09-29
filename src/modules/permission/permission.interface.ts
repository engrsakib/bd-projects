import { Document } from "mongoose";

export interface IPermission extends Document {
  key: string;
  description?: string;
  group?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
