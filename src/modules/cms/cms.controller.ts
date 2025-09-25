import { Request, Response } from "express";
import { ContentManagementService } from "./cms.service";
import BaseController from "@/shared/baseController";

class Controller extends BaseController {
  addBanner = this.catchAsync(async (req: Request, res: Response) => {
    const data = await ContentManagementService.addBanner(req.body);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Banner added successfully",
      data: data,
    });
  });

  addProductIdToBanner = this.catchAsync(
    async (req: Request, res: Response) => {
      const data = await ContentManagementService.addProductIdToBanner(
        req.params?.bannerId,
        req.params?.productId
      );
      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Product linked to banner successfully",
        data: data,
      });
    }
  );

  deleteProductIdToBanner = this.catchAsync(
    async (req: Request, res: Response) => {
      const data = await ContentManagementService.deleteProductIdToBanner(
        req.params?.bannerId,
        req.params?.productId
      );
      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Product deleted from banner successfully",
        data: data,
      });
    }
  );

  getBanners = this.catchAsync(async (req: Request, res: Response) => {
    const data = await ContentManagementService.getBanners();
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Banner finds successfully",
      data: data,
    });
  });

  deleteBanner = this.catchAsync(async (req: Request, res: Response) => {
    const data = await ContentManagementService.deleteBanner(
      req.params?.bannerId
    );
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Banner deleted successfully",
      data: data,
    });
  });

  getFeaturedProducts = this.catchAsync(async (req: Request, res: Response) => {
    const data = await ContentManagementService.getFeaturedProducts();
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Featured products fetched successfully",
      data: data,
    });
  });

  deleteFeaturedProducts = this.catchAsync(
    async (req: Request, res: Response) => {
      const data = await ContentManagementService.deleteFeaturedProducts(
        req.params?.variant_id
      );
      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Featured product deleted successfully",
        data: data,
      });
    }
  );

  addFeaturedProducts = this.catchAsync(async (req: Request, res: Response) => {
    const { product_id, variant_id } = req.body as {
      product_id: string;
      variant_id: string;
    };
    const data = await ContentManagementService.addFeaturedProducts(
      product_id,
      variant_id
    );
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Featured product added successfully",
      data: data,
    });
  });
}

export const ContentManagementController = new Controller();
