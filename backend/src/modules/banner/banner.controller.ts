import BaseController from "@/shared/baseController";
import { BannerService } from "./banner.service";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { Types } from "mongoose";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const result = await BannerService.create(data);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Banner created successfully",
      data: result,
    });
  });

  getAllBanners = this.catchAsync(async (req: Request, res: Response) => {
    const type = req.query.type as "normal" | "featured";
    const result = await BannerService.getAllBanners(type);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Banners retrieved successfully",
      data: result,
    });
  });

  getAvailableBanners = this.catchAsync(async (req: Request, res: Response) => {
    const type = req.query.type as "normal" | "featured";
    const result = await BannerService.getAvailableBanners(type);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Available banners retrieved successfully",
      data: result,
    });
  });

  updateBanner = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const data = req.body;
    const result = await BannerService.updateBanner(id, data);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Banner updated successfully",
      data: result,
    });
  });

  deleteBanner = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const result = await BannerService.deleteBanner(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Banner deleted successfully",
      data: result,
    });
  });
}

export const BannerController = new Controller();
