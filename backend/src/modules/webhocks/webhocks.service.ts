/* eslint-disable @typescript-eslint/no-unused-vars */
import BaseController from "@/shared/baseController";
import { OrderModel } from "@/modules/order/order.model";
import { ORDER_STATUS } from "@/modules/order/order.enums";
import CourierModel from "../courier/courier.model";
import { IOrderStatus } from "../order/order.interface";
import { OrderService } from "../order/order.service";
import { BarcodeModel } from "../barcode/barcode.model";
import { productBarcodeStatus } from "../barcode/barcode.enum";
import { IOrderItem } from "@/interfaces/common.interface";

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
    console.log(
      expectedToken,
      "token",
      authToken,
      "authToken",
      authToken === `Bearer ${expectedToken}`
    );

    console.log(data, "consignment id");

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

    console.log(data.notification_type, "notification type");

    if (data.notification_type === "delivery_status") {
      let mappedStatus =
        STATUS_MAP[String(data.status).toLowerCase()] || ORDER_STATUS.UNKNOWN;
      if (String(data.status).toLowerCase() === "cancelled") {
        mappedStatus = ORDER_STATUS.PENDING_RETURN;
      }
      order.order_status = mappedStatus as IOrderStatus;
      courier.order_status = mappedStatus as ORDER_STATUS;

      if (String(data.status).toLowerCase() === "delivered") {
        const allBarcodes = (order.items as IOrderItem[]).reduce(
          (acc: string[], item: any) => {
            if (item.barcode && item.barcode.length > 0) {
              acc.push(...item.barcode);
            }
            return acc;
          },
          []
        );

        if (allBarcodes.length > 0) {
          await BarcodeModel.updateMany(
            { barcode: { $in: allBarcodes } },
            {
              $set: { status: productBarcodeStatus.SOLD },
              $push: {
                updated_logs: {
                  $each: [
                    // ডাটা অবজেক্টটি এখানে থাকবে
                    {
                      name: "System Webhook",
                      role: "system",
                      admin_note: "Auto updated to sold via Courier Webhook",
                      system_message: `Order Delivered. Consignment: ${data.consignment_id} -- customer-name: ${order.customer_name} - customer-phone: ${order.customer_number} and order-id: ${order.order_id} on ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}`,
                      date: new Date(),
                    },
                  ],
                  $position: 0,
                },
              },
            }
          );
        }
      }

      if ("cod_amount" in data) {
        if (
          data.status === "delivered" ||
          data.status === "partial_delivered" ||
          data.status === "cancelled"
        ) {
          order.paid_amount += data.cod_amount;
          order.courier_cod_amount = data.cod_amount;
        }
      }
      if ("delivery_charge" in data)
        order.delivery_charge = data.delivery_charge;
      if ("tracking_message" in data)
        order.system_message = data.tracking_message;
      if ("updated_at" in data) {
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
      }
      await order.save();
      await courier.save();

      // if (String(data.status).toLowerCase() === "cancelled") {
      //   try {
      //     await OrderService.updateOrderStatus(
      //       order._id,
      //       "",
      //       ORDER_STATUS.PENDING_RETURN
      //     );
      //     console.log("Stock updated due to cancellation");
      //   } catch (error) {
      //     console.error("Error updating stock after cancellation:", error);
      //   }
      // }
    }
    // console.log(order.id, "order id for webhook tracking update");
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
