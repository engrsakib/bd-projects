import BaseController from "@/shared/baseController";
import { OrderModel } from "@/modules/order/order.model";
import { ORDER_STATUS } from "@/modules/order/order.enums";
import CourierModel from "../courier/courier.model";
import { IOrderStatus } from "../order/order.interface";

// Map steadfast status to system status
const STATUS_MAP: Record<string, string> = {
  pending: ORDER_STATUS.PENDING,
  delivered: ORDER_STATUS.DELIVERED,
  partial_delivered: ORDER_STATUS.PENDING_RETURN,
  cancelled: ORDER_STATUS.CANCELLED,
  unknown: ORDER_STATUS.UNKNOWN,
};

class service extends BaseController {
  /**
   * Handles Steadfast webhook payload, updates order status/info.
   * @param data Incoming webhook payload
   * @param authToken Bearer token from request header
   * @returns Success or error response object
   */
  async steadfastWebhock(data: any, authToken?: string) {
    const expectedToken = process.env.STEADFAST_WEBHOOK_TOKEN || "";
    if (!authToken || authToken !== `Bearer ${expectedToken}`) {
      return {
        status: "error",
        message: "Unauthorized webhook request.",
      };
    }

    if (!data.consignment_id || typeof data.consignment_id !== "number") {
      return {
        status: "error",
        message: "Invalid consignment ID.",
      };
    }

    const courier = await CourierModel.findOne({
      consignment_id: data.consignment_id,
    });

    if (!courier) {
      return {
        status: "error",
        message: "Order not found for this consignment ID.",
      };
    }

    const order = await OrderModel.findById(courier.order);
    if (!order) {
      return {
        status: "error",
        message: "Order not found.",
      };
    }

    const prevDeliveryCharge = Number(order.delivery_charge) || 0;
    const prevOrderStatus = order.order_status;

    if (data.notification_type === "delivery_status") {
      const mappedStatus =
        STATUS_MAP[String(data.status).toLowerCase()] || ORDER_STATUS.UNKNOWN;
      order.order_status = mappedStatus as IOrderStatus;
      courier.order_status = mappedStatus as ORDER_STATUS;

      if ("cod_amount" in data) order.paid_amount = data.cod_amount;
      if ("delivery_charge" in data)
        order.delivery_charge = data.delivery_charge;
      if ("tracking_message" in data)
        order.system_message = data.tracking_message;
      if ("updated_at" in data)
        if (
          prevOrderStatus == mappedStatus &&
          prevDeliveryCharge != order.delivery_charge
        ) {
          (order.logs ??= []).push({
            user: null,
            action: `Delivery charge updated from ${prevDeliveryCharge} to ${data.delivery_charge} by webhook`,
            time: new Date(data.updated_at),
          });
        } else if (
          prevOrderStatus != mappedStatus &&
          prevDeliveryCharge == order.delivery_charge
        ) {
          (order.logs ??= []).push({
            user: null,
            action: `Status updated to ${mappedStatus} by webhook`,
            time: new Date(data.updated_at),
          });
        } else if (
          prevOrderStatus != mappedStatus &&
          prevDeliveryCharge != order.delivery_charge
        ) {
          (order.logs ??= []).push({
            user: null,
            action: `Status updated to ${mappedStatus}, delivery charge from ${prevDeliveryCharge} to ${data.delivery_charge} and ${data.tracking_message} by webhook`,
            time: new Date(data.updated_at),
          });
        }
      await order.save();
      await courier.save();
    }

    if (data.notification_type === "tracking_update") {
      order.system_message = data.tracking_message || "";
      if ("updated_at" in data)
        (order.logs ??= []).push({
          user: null,
          action: `Tracking update: ${data.tracking_message}`,
          time: new Date(data.updated_at),
        });
      await order.save();
      await courier.save();
    }

    return {
      status: "success",
      message: "Webhook received successfully.",
    };
  }
}

export const WebhocksService = new service();
