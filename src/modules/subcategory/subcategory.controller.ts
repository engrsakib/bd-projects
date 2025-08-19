import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { SubcategoryService } from "./subcategory.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";
import { ISubcategoryStatus } from "./subcategory.enums";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    await SubcategoryService.create({ ...req.body, created_by: req?.user?.id });
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Sub category created successfully",
    });
  });

  getAll = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const result = await SubcategoryService.getAll(
      options,
      req.query.search_query as string,
      req.query.status as ISubcategoryStatus
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Subcategories fetched successfully",
      data: result,
    });
  });

  getAllAvailable = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const result = await SubcategoryService.getAllAvailable(
      options,
      req.query.search_query as string
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Available subcategories retrieved successfully",
      data: result,
    });
  });

  getById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await SubcategoryService.getById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Subcategories fetched successfully",
      data: result,
    });
  });

  update = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await SubcategoryService.update(id, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Subcategory updated successfully",
      data: null,
    });
  });

  getByCategory = this.catchAsync(async (req: Request, res: Response) => {
    const category_id = req.params.category_id;
    const data = await SubcategoryService.getByCategory(category_id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Subcategories fetched successfully",
      data,
    });
  });

  getBySlug = this.catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const data = await SubcategoryService.getBySlug(slug);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Subcategory fetched successfully",
      data,
    });
  });
}

export const SubcategoryController = new Controller();
