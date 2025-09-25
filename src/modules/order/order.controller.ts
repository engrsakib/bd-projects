import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import { OrderQuery } from "@/interfaces/common.interface";

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
    const data = await OrderService.getOrderById(req.params.id as string);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order retrieved successfully",
      data,
    });
  });
  getOrders = this.catchAsync(async (req: Request, res: Response) => {
    // console.log(req.query, "params")
    const query: any = req.query;
    const data = await OrderService.getOrders(query as OrderQuery);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Orders retrieved successfully",
      data,
    });
  });

  updateOrderStatus = this.catchAsync(async (req: Request, res: Response) => {
    const data = await OrderService.updateOrderStatus(
      req.body.id as string,
      req.body.status
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order status updated successfully",
      data,
    });
  });

  deleteOrder = this.catchAsync(async (req: Request, res: Response) => {
    const data = await OrderService.deleteOrder(req.params.id as string);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order deleted successfully",
      data,
    });
  });

  orderTracking = this.catchAsync(async (req: Request, res: Response) => {
    const { order_id } = req.params;
    if (!order_id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Order ID is required",
      });
    }

    const data = await OrderService.order_tracking(order_id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order tracking information retrieved successfully",
      data,
    });
  });
}

export const OrderController = new Controller();
