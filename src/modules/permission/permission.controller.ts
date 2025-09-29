import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { PermissionService } from "./permission.service";

class Controller extends BaseController {
  createAndUpdatePermissions = this.catchAsync(
    async (req: Request, res: Response) => {
      const userId = req.params.user_id as string;
      const { permissions, description } = req.body;
      const data = await PermissionService.CreateAndUpdatePermissions(
        userId,
        permissions,
        description
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
