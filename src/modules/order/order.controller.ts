import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { HttpStatusCode } from "@/lib/httpStatus";
import { OrderQuery } from "@/interfaces/common.interface";
import ApiError from "@/middlewares/error";
import { ReportParams } from "./order.interface";

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

  placeOrderAdmin = this.catchAsync(async (req: Request, res: Response) => {
    console.log(req.body, "admin order");

    const data = await OrderService.placeOrderAdmin({
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

  placeExchangeOrReturnOrder = this.catchAsync(
    async (req: Request, res: Response) => {
      console.log(req.body, "admin order");

      const data = await OrderService.placeExchangeOrReturnOrder({
        ...req.body,
        user_id: req.body?.user_id || req.user?.id,
      });
      this.sendResponse(res, {
        statusCode: HttpStatusCode.CREATED,
        success: true,
        message: "Your order has been placed successfully",
        data,
      });
    }
  );

  editOrder = this.catchAsync(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const data = await OrderService.editOrder(orderId, req.body);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order updated successfully",
      data,
    });
  });

  generateOrderReport = this.catchAsync(async (req: Request, res: Response) => {
    const query: ReportParams = req.query;

    const data = await OrderService.generateOrderReport(query);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order report generated successfully",
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
    const { id, status } = req.body;
    if (!id || !status) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Order ID and Status are required",
      });
    }

    const data = await OrderService.updateOrderStatus(
      id as string,
      req.user?.id as string,
      status
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order status updated successfully",
      data,
    });
  });

  cancleOrder = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Order ID is required",
      });
    }
    const data = await OrderService.cancleOrder(
      id as string,
      req.user?.id as string
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order cancelled successfully",
      data,
    });
  });

  updateOrderStatusBulk = this.catchAsync(
    async (req: Request, res: Response) => {
      const { ids, status } = req.body;
      if (!ids || !status) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Order IDs and Status are required",
        });
      }

      const concurrency = Math.min(ids.length, 5);
      const params = {
        ids,
        userId: req.user?.id as string,
        status,
        concurrency,
      };
      const data = await OrderService.updateOrdersStatusBulk(params);
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Order status updated successfully",
        data,
      });
    }
  );

  deleteOrder = this.catchAsync(async (req: Request, res: Response) => {
    if (!req.params.id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Order ID is required",
      });
    }

    const data = await OrderService.deleteOrder(req.params.id as string);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order deleted successfully",
      data,
    });
  });

  orderTracking = this.catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Order ID is required",
      });
    }

    const data = await OrderService.order_tracking(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Order tracking information retrieved successfully",
      data,
    });
  });

  loginUserOrder = this.catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const phone_number = req.user?.phone_number;
    if (!userId) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.UNAUTHORIZED,
        success: false,
        message: "Unauthorized access",
      });
    }

    const data = await OrderService.loginUserOrder(userId, phone_number);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "User orders retrieved successfully",
      data,
    });
  });

  addAdminNoteToOrder = this.catchAsync(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { note } = req.body;
    const userId = req?.user.id;
    // console.log("Adding admin note to order", { userId });
    if (!note || note.trim() === "") {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Note content is required"
      );
    }
    const result = await OrderService.addAdminNoteToOrder(
      orderId,
      note,
      userId
    );
    return this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Admin note added to order successfully",
      data: result,
    });
  });

  setOrderReadyForAccepted = this.catchAsync(
    async (req: Request, res: Response) => {
      const orderId = req.params.orderId;
      const user = req?.user.id;

      // console.log("order id", orderId, "user id", user);

      // const params = { orderId, user };

      const result = await OrderService.setOrderReadyForAccepted({
        order_id: orderId,
        user,
      });
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Order set to ready for accepted successfully",
        data: result,
      });
    }
  );
}

export const OrderController = new Controller();
