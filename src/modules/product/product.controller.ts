import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";
import { Types } from "mongoose";

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

  getAllPublishedProducts = this.catchAsync(
    async (req: Request, res: Response) => {
      const options = pickQueries(req.query, paginationFields);
      const result = await ProductService.getAllPublishedProducts(
        options,
        req.query.search_query as string
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Published products retrieved successfully",
        data: result,
      });
    }
  );

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
}

export const ProductController = new Controller();
