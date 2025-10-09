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

  // find all product are available in db without pagination
  findAllProducts = this.catchAsync(async (req: Request, res: Response) => {
    console.log("Finding all products");
    const search_query = req.query?.search_query as string;
    const is_published = req.query?.is_published as unknown as boolean;
    // fields will be comma separated string, we have to make it string[]
    const fields = ((req.query?.fields as string) || "")
      .split(",")
      .map((field) => field.trim());
    const result = await ProductService.findAllProducts(
      search_query,
      is_published,
      fields
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "All products retrieved successfully",
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

  // get product by id and slug
  getBySlugAndTitle = this.catchAsync(async (req: Request, res: Response) => {
    const slug = req.query.slug as string;
    const title = req.query.title as string;

    // console.log(slug, title, "slug and title");

    // Query param থেকে pagination নাও (ডিফল্ট page=1, limit=10)
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;

    // Service কল করো
    const result = await ProductService.getBySlugAndTitle(
      slug,
      title,
      page,
      limit
    );

    // Response পাঠাও
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Products retrieved successfully",
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

  getRelatedOrders = this.catchAsync(async (req: Request, res: Response) => {
    const category = req.params.category as string;
    const data = await ProductService.getRelatedOrders(category);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Related products retrieved successfully",
      data,
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
