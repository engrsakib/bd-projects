import { Request, Response } from "express";
import { StockService } from "./stock.service";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";
import { stockFilterableFields } from "./stock.interface";
import ApiError from "@/middlewares/error";

class Controller extends BaseController {
  transferStocks = this.catchAsync(async (req: Request, res: Response) => {
    const stock = await StockService.transferStocks({
      ...req.body,
      transferBy: req?.user?.id,
    });
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Stock added successfully",
      data: stock,
    });
  });

  getStockById = this.catchAsync(async (req: Request, res: Response) => {
    const { product_id, variant_id } = req.params;
    const stock = await StockService.getStockById(product_id, variant_id);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stocks fetched successfully",
      data: stock,
    });
  });

  getAllStocks = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const filters = pickQueries(req.query, stockFilterableFields);

    const stocks = await StockService.getAllStocks(options, filters);

    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      data: stocks,
      message: "Stocks fetched successfully",
    });
  });

  getStockByAProduct = this.catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const stock = await StockService.getStockByAProduct(slug);
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stocks retrieved by product successfully",
      data: stock,
    });
  });

  updateStock = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedStocks = await StockService.updateStock(id, req.body);
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stock updated successfully",
      data: updatedStocks,
    });
  });

  deleteStock = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await StockService.deleteStock(id);

    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stock deleted successfully",
      data: deleted,
    });
  });

  getFullStockReport = this.catchAsync(async (req: Request, res: Response) => {
    const { sku, threshold, page, limit } = req.query;
    const report = await StockService.getFullStockReport({
      sku: sku as string,
      threshold: threshold ? parseInt(threshold as string, 0) : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Full stock report generated successfully",
      data: report,
    });
  });

  getLowStockProducts = this.catchAsync(async (req: Request, res: Response) => {
    const { threshold, page, limit } = req.query;
    const report = await StockService.getLowStockProducts({
      threshold: threshold ? parseInt(threshold as string, 10) : 10,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Low stock products fetched successfully",
      data: report,
    });
  });

  stocksAdjustment = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.body || !req.body.products || req.body.products.length === 0) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Invalid payload: Products array is required"
      );
    }

    const payload = {
      ...req.body,

      adjust_by: req.user ? req.user._id : req.body.adjust_by,
    };

    const result = await StockService.stocksAdjustment(payload);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Stock adjustment processed successfully",
      data: result,
    });
  });
}

export const StockController = new Controller();
