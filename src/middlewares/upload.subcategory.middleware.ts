import { NextFunction, Request, Response } from "express";
import ApiError from "./error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { AWSFileUploader } from "@/modules/aws/uploader";
import { SubcategoryModel } from "@/modules/subcategory/subcategory.model";

const folder = "subcategories";

class Middleware {
  async uploadSubcategoryImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!req.body?.name) {
      return next(
        new ApiError(HttpStatusCode.BAD_REQUEST, "Subcategory name is required")
      );
    }

    const isExist = await SubcategoryModel.findOne({ name: req.body?.name });
    if (isExist) {
      return next(
        new ApiError(
          HttpStatusCode.CONFLICT,
          "This subcategory is already exists. Please use a different name."
        )
      );
    }

    const image = req.file;
    if (image) {
      try {
        const imageUrl = await AWSFileUploader.uploadSingleFile(image, folder);
        req.body.image = imageUrl;
        next();
      } catch (error: any) {
        console.log(error);
        return next(
          new ApiError(
            error?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
            "Failed to upload subcategory image"
          )
        );
      }
    }

    if (req.body.serial) {
      req.body.serial = Number(req.body.serial);
    }
  }

  async updateSubcategoryImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    if (!id) {
      return next(
        new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Params subcategory id is required"
        )
      );
    }

    if (req.body?.name) {
      const isNameExist = await SubcategoryModel.findOne({
        name: req.body.name,
        _id: { $ne: id },
      });
      if (isNameExist) {
        return next(
          new ApiError(
            HttpStatusCode.CONFLICT,
            "This subcategory name already exists. Please use a different name."
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
            "Failed to upload subcategory image"
          )
        );
      }
    }

    next();
  }
}

export const SubcategoryMiddleware = new Middleware();
