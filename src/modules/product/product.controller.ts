import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { HttpStatusCode } from "@/lib/httpStatus";

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
}

export const ProductController = new Controller();
