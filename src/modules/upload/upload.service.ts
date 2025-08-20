import { HttpStatusCode } from "@/lib/httpStatus";
import ApiError from "../../middlewares/error";
import { AWSFileUploader } from "../aws/uploader";

class Service {
  private readonly folder = "uploads";

  async uploadSingleFile(file: Express.Multer.File) {
    if (!file) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Upload file is required");
    }
    const url = await AWSFileUploader.uploadSingleFile(file, this.folder);

    return { url };
  }

  async uploadMultipleFiles(files: Express.Multer.File[]) {
    if (files.length <= 0) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Upload files are required"
      );
    }

    const urls = await AWSFileUploader.uploadMultipleFiles(files, this.folder);

    return { urls };
  }
}

export const UploadService = new Service();
