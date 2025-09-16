import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  placeOrder = this.catchAsync(async (req: Request, res: Response) => {
    const data = await OrderService.placeOrder({
      ...req.body,
      user_id: req.body?.user_id || req.user?.id,
    });
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Your order has been placed successfully",
      data,
    });
  });
  getOrderById = this.catchAsync(async (req: Request, res: Response) => {
    // console.log(req.params.id, req.user);
    const data = await OrderService.getOrderById(req.body.id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order retrieved successfully",
      data,
    });
  });
  getOrders = this.catchAsync(async (req: Request, res: Response) => {
    const data = await OrderService.getOrders();
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Orders retrieved successfully",
      data,
    });
  });
}

export const OrderController = new Controller();
