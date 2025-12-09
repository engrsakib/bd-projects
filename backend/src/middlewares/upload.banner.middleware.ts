import { HttpStatusCode } from "@/lib/httpStatus";
import ApiError from "./error";
import { AWSFileUploader } from "@/modules/aws/uploader";
import { NextFunction, Request, Response } from "express";

class Middleware {
  private readonly folder = "banners";
  uploadBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { file } = req;
      if (!file) {
        return next(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Banner thumbnail is required"
          )
        );
      }
      const bannerUrl = await AWSFileUploader.uploadSingleFile(
        file,
        this.folder
      );
      req.body.thumbnail = bannerUrl;

      // safely parse the products
      const products = JSON.parse(req.body.products);
      req.body.products = products;

      console.log(req.body);

      next();
    } catch (error: any) {
      return next(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error?.message || "Failed to upload banner image"
        )
      );
    }
  };

  updateBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { file } = req;
      if (file) {
        const bannerUrl = await AWSFileUploader.uploadSingleFile(
          file,
          this.folder
        );
        req.body.thumbnail = bannerUrl;
      }
      const products = JSON.parse(req.body.products);
      req.body.products = products || [];
      next();
    } catch (error: any) {
      return next(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error?.message || "Failed to upload banner image"
        )
      );
    }
  };
}

export const BannerMiddleware = new Middleware();
