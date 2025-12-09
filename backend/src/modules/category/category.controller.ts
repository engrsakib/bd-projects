import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import BaseController from "@/shared/baseController";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";

class Controller extends BaseController {
  // ADMIN & VENDOR Controllers
  create = this.catchAsync(async (req: Request, res: Response) => {
    await CategoryService.create({ ...req.body, created_by: req?.user?.id });
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Category created successfully",
      data: null,
    });
  });

  getAll = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const result = await CategoryService.getAll(
      options,
      req.query.search_query as string
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Categories fetched successfully",
      data: result,
    });
  });

  getById = this.catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getById(req.params.id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Category fetched successfully",
      data: result,
    });
  });

  update = this.catchAsync(async (req: Request, res: Response) => {
    await CategoryService.update(req.params.id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Category updated successfully",
      data: null,
    });
  });

  updateStatus = this.catchAsync(async (req: Request, res: Response) => {
    await CategoryService.updateStatus(req.params.id, req.body.status);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Category status updated successfully",
      data: null,
    });
  });

  // PUBLIC Controllers
  getAvailableCategories = this.catchAsync(
    async (req: Request, res: Response) => {
      const result = await CategoryService.getAvailableCategories(
        req.query.search_query as string,
        req.query.sortBy as "name" | "serial" | "createdAt",
        req.query.sortOrder as "asc" | "desc"
      );
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Available categories fetched successfully",
        data: result,
      });
    }
  );

  getBySlug = this.catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getBySlug(req.params.slug);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Category fetched successfully",
      data: result,
    });
  });
}

export const CategoryController = new Controller();
