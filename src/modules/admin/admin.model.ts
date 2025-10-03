import { model, Schema } from "mongoose";
import { IAdmin } from "./admin.interface";
import { schemaOptions } from "@/utils/schemaOptions";
import { ROLES } from "@/constants/roles";

const adminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    is_Deleted: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      default: null,
    },
    designation: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: ROLES.ADMIN,
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["inactive", "admin_approval", "active"],
      default: "inactive",
    },
  },
  schemaOptions
);

export const AdminModel = model("Admin", adminSchema);
