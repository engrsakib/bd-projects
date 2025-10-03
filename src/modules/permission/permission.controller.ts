import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { PermissionService } from "./permission.service";

class Controller extends BaseController {
  createAndUpdatePermissions = this.catchAsync(
    async (req: Request, res: Response) => {
      const userId = req.body.id as string;

      if (!userId) {
        this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "User ID is required",
        });
        return;
      }

      const { permissions, note } = req.body;
      const data = await PermissionService.CreateAndUpdatePermissions(
        userId,
        permissions,
        note
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Permissions updated successfully",
        data,
      });
    }
  );
}

export const PermissionController = new Controller();
