import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import mongoose from "mongoose";
import { PermissionModel } from "./permission.mode";
import { AdminModel } from "../admin/admin.model";
import { PermissionEnum } from "./permission.enum";

class Service {
  async CreateAndUpdatePermissions(
    userId: string,
    permissions: string[],
    description?: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await AdminModel.findById(userId).session(session);
      if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
      }

      let ValidPermission = null;

      if (user.permissions) {
        ValidPermission = await PermissionModel.findById(
          user.permissions
        ).session(session);
      }

      if (!ValidPermission) {
        const newPermission = new PermissionModel({
          user: user._id,
          key: permissions as PermissionEnum[],
          description: description || "Permission created by admin",
          createdBy: user._id,
        });

        await newPermission.save({ session });
        user.permissions = newPermission._id as any;
        await user.save({ session });
        ValidPermission = newPermission;
      } else {
        ValidPermission.key = permissions as PermissionEnum[];
        if (description) {
          ValidPermission.description = description;
        }
        await ValidPermission.save({ session });
      }
      await session.commitTransaction();
      return { user, permission: ValidPermission };
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to update permissions"
      );
    } finally {
      session.endSession();
    }
  }
}

export const PermissionService = new Service();
