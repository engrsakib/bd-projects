import { NextFunction, Request, Response } from "express";
import ApiError from "./error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { AWSFileUploader } from "@/modules/aws/uploader";
import { ProductModel } from "@/modules/product/product.model";

const folder = "products";

class Middleware {
  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      // Basic validations
      if (!req.body?.name) {
        return next(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Product name is required")
        );
      }

      if (!req.body?.description) {
        return next(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Product description is required"
          )
        );
      }

      if (!req.body?.category) {
        return next(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Product category is required"
          )
        );
      }

      const isExist = await ProductModel.findOne({
        name: new RegExp(`^${req.body?.name}$`, "i"),
      });
      if (isExist) {
        return next(
          new ApiError(
            HttpStatusCode.CONFLICT,
            "This product name already exists. Please use a different name."
          )
        );
      }

      const files = req.files as any;

      const thumbnail = files?.["thumbnail"]?.[0];
      const slider_images = files?.["slider_images"];

      if (!thumbnail) {
        return next(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Product thumbnail is required"
          )
        );
      }

      // Upload files
      const thumbnailUrl = await AWSFileUploader.uploadSingleFile(
        thumbnail,
        folder
      );
      req.body.thumbnail = thumbnailUrl;

      if (slider_images?.length) {
        const sliderImageUrls = await AWSFileUploader.uploadMultipleFiles(
          slider_images,
          folder
        );
        req.body.slider_images = sliderImageUrls;
      }

      next();
    } catch (error: any) {
      console.error(error);
      return next(
        new ApiError(
          error?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
          error?.message || "Failed to upload product images"
        )
      );
    }
  }
}

export const ProductMiddleware = new Middleware();
