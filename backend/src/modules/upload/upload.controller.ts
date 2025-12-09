import { Request, Response } from "express";
import { UploadService } from "./upload.service";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  uploadSingleFile = this.catchAsync(async (req: Request, res: Response) => {
    const data = await UploadService.uploadSingleFile(
      req.file as Express.Multer.File
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "File uploaded successfully",
      data,
    });
  });
  uploadMultipleFiles = this.catchAsync(async (req: Request, res: Response) => {
    const data = await UploadService.uploadMultipleFiles(
      req.files as Express.Multer.File[]
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Files uploaded successfully",
      data,
    });
  });
}

export const UploadController = new Controller();
