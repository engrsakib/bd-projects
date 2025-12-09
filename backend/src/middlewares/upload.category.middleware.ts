import { NextFunction, Request, Response } from "express";
import ApiError from "./error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { AWSFileUploader } from "@/modules/aws/uploader";
import { CategoryModel } from "@/modules/category/category.model";

const folder = "categories";

class Middleware {
  async uploadCategoryImage(req: Request, res: Response, next: NextFunction) {
    if (!req.body?.name) {
      return next(
        new ApiError(HttpStatusCode.BAD_REQUEST, "Category name is required")
      );
    }

    const isExist = await CategoryModel.findOne({ name: req.body?.name });
    if (isExist) {
      return next(
        new ApiError(
          HttpStatusCode.CONFLICT,
          "This category is already exists. Please use a different name."
        )
      );
    }

    const image = req.file;
    if (!image) {
      return next(
        new ApiError(HttpStatusCode.BAD_REQUEST, "Category image is required")
      );
    }

    if (req.body.serial) {
      req.body.serial = Number(req.body.serial);
    }

    try {
      const imageUrl = await AWSFileUploader.uploadSingleFile(image, folder);
      req.body.image = imageUrl;
      next();
    } catch (error: any) {
      console.log(error);
      return next(
        new ApiError(
          error?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
          "Failed to upload category image"
        )
      );
    }
  }

  async updateCategoryImage(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    if (!id) {
      return next(
        new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Params category id is required"
        )
      );
    }

    if (req.body?.name) {
      const isNameExist = await CategoryModel.findOne({
        name: req.body.name,
        _id: { $ne: id },
      });
      if (isNameExist) {
        return next(
          new ApiError(
            HttpStatusCode.CONFLICT,
            "This category name already exists. Please use a different name."
          )
        );
      }
    }

    if (req.body.serial) {
      req.body.serial = Number(req.body.serial);
    }

    const image = req.file;
    if (image) {
      try {
        const imageUrl = await AWSFileUploader.uploadSingleFile(image, folder);
        req.body.image = imageUrl;
      } catch (error: any) {
        return next(
          new ApiError(
            error?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
            "Failed to upload category image"
          )
        );
      }
    }

    next();
  }
}

export const CategoryMiddleware = new Middleware();
