import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { LocationService } from "./location.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import pickQueries from "@/shared/pickQueries";
import { paginationFields } from "@/constants/paginationFields";

class Controller extends BaseController {
  create = this.catchAsync(async (req: Request, res: Response) => {
    await LocationService.create(req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: `Location with type ${req.body?.type || "warehouse"} created successfully`,
      data: null,
    });
  });

  getAllLocations = this.catchAsync(async (req: Request, res: Response) => {
    const options = pickQueries(req.query, paginationFields);
    const data = await LocationService.getAllLocations(
      options,
      req.query.search_query as string,
      req.query.type as "outlet" | "warehouse" | "distribution_center"
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Locations retrieved successfully",
      data,
    });
  });

  getById = this.catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await LocationService.getById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Location retrieved successfully",
      data,
    });
  });

  getBySlug = this.catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const data = await LocationService.getBySlug(slug);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Location retrieved successfully",
      data,
    });
  });
}

export const LocationController = new Controller();
