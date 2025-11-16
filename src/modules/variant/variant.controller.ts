import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { VariantService } from "./variant.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import { Types } from "mongoose";
import { paginationFields } from "@/constants/paginationFields";
import pickQueries from "@/shared/pickQueries";

class Controller extends BaseController {
  createVariant = this.catchAsync(async (req: Request, res: Response) => {
    const result = await VariantService.createVariant(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Variant created successfully",
      data: result,
    });
  });

  updateOne = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const result = await VariantService.updateOne(id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variant updated successfully",
      data: result,
    });
  });

  updateMany = this.catchAsync(async (req: Request, res: Response) => {
    const result = await VariantService.updateMany(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variants updated successfully",
      data: result,
    });
  });

  deleteVariant = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const result = await VariantService.deleteVariant(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variant deleted successfully",
      data: result,
    });
  });

  updateVariantsOfAProduct = this.catchAsync(
    async (req: Request, res: Response) => {
      const product_id = req.params.product_id as string;
      const result = await VariantService.updateVariantsOfAProduct(
        product_id,
        req.body
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Variants updated successfully",
        data: result,
      });
    }
  );

  searchVariantsBySku = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const result = await VariantService.searchVariantsBySku(
      req.query.search_query as string,
      options
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Variants fetched successfully",
      data: result,
    });
  });

  searchVariantsBySkuPurchase = this.catchAsync(
    async (req: Request, res: Response) => {
      const options = pickQueries(req.query, paginationFields);
      const result = await VariantService.searchVariantsBySkuPurchase(
        req.query.search_query as string,
        options
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Variants fetched successfully",
        data: result,
      });
    }
  );

  searchVariantsBySkuForAdmin = this.catchAsync(
    async (req: Request, res: Response) => {
      const options = pickQueries(req.query, paginationFields);

      const result = await VariantService.searchVariantsBySkuForAdmin(
        req.query.search_query as string,
        options
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Variants fetched successfully",
        data: result,
      });
    }
  );
}

export const VariantController = new Controller();
