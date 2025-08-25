import { Request, Response } from "express";
import { StockService } from "./stock.service";
import BaseController from "@/shared/baseController";
import { IExpenseApplied } from "../purchase/purchase.interface";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  transferStocks = this.catchAsync(async (req: Request, res: Response) => {
    const stockData = req.body as {
      from: string;
      to: string;
      items: Array<{ variant: string; qty: number; product: string }>;
      user_id?: string; // for audit if needed
      expenses_applied?: IExpenseApplied[];
    };
    stockData.user_id = req?.user?.id || ""; // Attach the user ID from the request
    const stock = await StockService.transferStocks(stockData);
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Stock added successfully",
      data: stock,
    });
  });

  transferHistoryByBusinessLocation = this.catchAsync(
    async (req: Request, res: Response) => {
      const { page, limit } = req.query as {
        page?: string;
        limit?: string;
      };
      const business_location_id = req.params.business_location_id;

      const transfer = await StockService.transferHistoryByBusinessLocation({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        business_location_id,
      });

      return this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        data: transfer,
        message: "All Inventories get successfully",
      });
    }
  );
  transferHistoryForAdmin = this.catchAsync(
    async (req: Request, res: Response) => {
      const { page, limit, from, to } = req.query as {
        page?: string;
        limit?: string;
        from?: string;
        to?: string;
      };

      const transfer = await StockService.transferHistoryForAdmin({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        from,
        to,
      });

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        data: transfer,
        message: "All Inventories get successfully",
      });
    }
  );

  getStockById = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const stock = await StockService.getStockById(id);

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stocks fetched successfully",
      data: stock,
    });
  });

  getAllStocks = this.catchAsync(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      productId,
      variantId,
      categoryId,
      subcategoryId,
      businessLocationId,
      sku,
      searchQuery,
      minQty,
      maxQty,
    } = req.query as {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      productId?: string;
      variantId?: string;
      categoryId?: string;
      subcategoryId?: string;
      businessLocationId?: string;
      sku?: string;
      searchQuery?: string;
      minQty?: string;
      maxQty?: string;
    };

    const stocks = await StockService.getAllStocks({
      businessLocationId,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy || "updatedAt",
      sortOrder: (sortOrder as "asc" | "desc") || "desc",
      productId: productId || undefined,
      variantId: variantId || undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      sku: sku || undefined,
      searchQuery: searchQuery || undefined,
      minQty: minQty ? Number(minQty) : undefined,
      maxQty: maxQty ? Number(maxQty) : undefined,
    });

    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      data: stocks,
      message: "Stocks fetched successfully by business location",
    });
  });

  updateStock = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedStocks = await StockService.updateStock(id, req.body);
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stocks updated successfully",
      data: updatedStocks,
    });
  });

  deleteStock = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await StockService.deleteStock(id);

    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stocks deleted successfully",
      data: deleted,
    });
  });

  getProductStock = this.catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const stock = await StockService.getProductStock(slug);
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Stocks fetched successfully",
      data: stock,
    });
  });
}

export const StockController = new Controller();
