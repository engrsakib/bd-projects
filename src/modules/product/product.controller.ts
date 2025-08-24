import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";
import { Types } from "mongoose";
import { productFilterableFields } from "./product.constants";
import ApiError from "@/middlewares/error";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.create(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Product created successfully",
      data: result,
    });
  });

  getAllProducts = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const filters = pickQueries(req.query, productFilterableFields);
    const result = await ProductService.getAllProducts(options, filters);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Published products retrieved successfully",
      data: result,
    });
  });

  getAllProductsForAdmin = this.catchAsync(
    async (req: Request, res: Response) => {
      const options = pickQueries(req.query, paginationFields);
      const filters = pickQueries(req.query, productFilterableFields);
      const result = await ProductService.getAllProductsForAdmin(
        options,
        filters
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Products retrieved successfully",
        data: result,
      });
    }
  );

  getProductsByIds = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.query.ids) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Product IDs missing");
    }
    const ids = (req.query.ids as string)
      .split(",")
      .map((id) => new Types.ObjectId(id.trim()));
    const result = await ProductService.getProductsByIds(ids);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Products retrieved successfully",
      data: result,
    });
  });

  getById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    const result = await ProductService.getById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Product retrieved successfully",
      data: result,
    });
  });

  getBySlug = this.catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug as unknown as string;
    const result = await ProductService.getBySlug(slug);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Product retrieved successfully",
      data: result,
    });
  });

  toggleVisibility = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    await ProductService.toggleVisibility(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Product visibility toggled successfully",
      data: null,
    });
  });

  update = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    await ProductService.update(id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Product updated successfully",
      data: null,
    });
  });

  deleteProduct = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as unknown as Types.ObjectId;
    await ProductService.deleteProduct(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Product deleted successfully",
      data: null,
    });
  });
}

export const ProductController = new Controller();
