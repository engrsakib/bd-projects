import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    await ProductService.create(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Product created successfully",
      data: null,
    });
  });

  getAllProducts = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const result = await ProductService.getAllProducts(
      options,
      req.query.search_query as string
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Products retrieved successfully",
      data: result,
    });
  });
}

export const ProductController = new Controller();
