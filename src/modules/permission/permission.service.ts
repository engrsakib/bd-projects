import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import mongoose from "mongoose";
import { PermissionModel } from "./permission.mode";
import { AdminModel } from "../admin/admin.model";
import { PermissionEnum } from "./permission.enum";

class Service {
  async CreateAndUpdatePermissions(
    userId: string,
    permissions: PermissionEnum[],
    note?: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await AdminModel.findById(userId).session(session);
      if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
      }

      if (!permissions || permissions.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Permissions are required"
        );
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
          key: permissions,
          note: note || "Permission created by admin",
          createdBy: user._id,
        });

        await newPermission.save({ session });
        user.permissions = newPermission._id as any;
        await user.save({ session });
        ValidPermission = newPermission;
      } else {
        ValidPermission.key = permissions;
        if (note) {
          ValidPermission.note = note;
        }
        await ValidPermission.save({ session });
      }
      user.password = undefined as any;
      await session.commitTransaction();
      return { user, permission: ValidPermission };
    } catch (error) {
      console.error("Error in CreateAndUpdatePermissions:", error);
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to create/update permissions"
      );
    } finally {
      session.endSession();
    }
  }
}

export const PermissionService = new Service();
