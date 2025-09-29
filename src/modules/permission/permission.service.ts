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
    description?: string,
    type?: "add" | "remove"
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await AdminModel.findById(userId).session(session);
      if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
      }
      const ValidPermission = await PermissionModel.findById(user.permissions);
      if (!ValidPermission) {
        await session.abortTransaction();
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Permission not found");
      }

      if (type === "add") {
        ValidPermission.key.push(...(permissions as PermissionEnum[]));
      } else if (type === "remove") {
        ValidPermission.key = ValidPermission.key.filter(
          (perm: any) => !permissions.includes(perm)
        );
      }
      await ValidPermission.save({ session });

      await session.commitTransaction();
      return user;
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
