import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { DefaultsPurchaseService } from "./defult-purchase.service";
import pickQueries from "@/shared/pickQueries";

class Controller extends BaseController {
  // createPurchase = this.catchAsync(async (req: Request, res: Response) => {
  //   if (!req.body) {
  //     return this.sendResponse(res, {
  //       statusCode: HttpStatusCode.BAD_REQUEST,
  //       success: false,
  //       message: "Request body is required",
  //     });
  //   }

  //   if (!req.body.product || !req.body.unit_cost || !req.body.variant) {
  //     return this.sendResponse(res, {
  //       statusCode: HttpStatusCode.BAD_REQUEST,
  //       success: false,
  //       message: "Product, unit_cost, and variant are required",
  //     });
  //   }

  //   const data = await DefaultsPurchaseService.createPurchase(req.body);
  //   this.sendResponse(res, {
  //     statusCode: HttpStatusCode.CREATED,
  //     success: true,
  //     message: "Default purchase created successfully",
  //     data,
  //   });
  // });

  createPurchase = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.body) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Request body is required",
      });
    }

    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Payload cannot be an empty array",
      });
    }

    for (const item of items) {
      if (!item.product || item.unit_cost === undefined || !item.variant) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Product, unit_cost, and variant are required for all items",
        });
      }
    }

    const data = await Promise.all(
      items.map(async (item) => {
        return await DefaultsPurchaseService.createPurchases([item]);
      })
    );

    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Default purchases created/updated successfully",
      data,
    });
  });

  getAllDefaultsPurchases = this.catchAsync(
    async (req: Request, res: Response) => {
      const filters = pickQueries(req.query, [
        "page",
        "limit",
        "sortBy",
        "sortOrder",
        "searchTerm",
        "product",
        "variant",
        "supplier",
      ]);

      const result =
        await DefaultsPurchaseService.getAllDefaultsPurchases(filters);

      console.log(result, "defulat result");

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "ALL Default purchases retrieved successfully",
        data: result,
      });
    }
  );
}

export const DefaultsPurchaseController = new Controller();
