import ApiError from "@/middlewares/error";
import { MARCHANT, TCourierPayload } from "./courier.interface";
import { OrderModel } from "../order/order.model";

import { CourierMiddleware } from "./courier.middleware";
import { ORDER_STATUS } from "../order/order.enums";
import CourierModel from "./courier.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IOrder, IOrderStatus } from "../order/order.interface";
import { StockModel } from "../stock/stock.model";
import { LotModel } from "../lot/lot.model";

class Service {
  // courier sevice integration
  async transferToCourier(
    order_id: string,
    note: string = "Order transferred to courier",
    marchant: string
  ) {
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findOne({ _id: order_id })
        .populate("user")
        .session(session);

      if (!order) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
      } else if (
        !order ||
        order.order_status === ORDER_STATUS.CANCELLED ||
        order.order_status === ORDER_STATUS.FAILED ||
        order.order_status === ORDER_STATUS.DELIVERED ||
        !marchant
      ) {
        throw new ApiError(
          HttpStatusCode.UNAUTHORIZED,
          `you can't transfer this order status ${order ? order.order_status : "unknown"} to courier`
        );
      }

      // if (business_location) {
      //   // Check if the order is already assigned to an business_location
      //   if (order.is_assigned_to_business_location) {
      //     throw new ApiError(
      //       400,
      //       "Order is already assigned to an business_location and cannot be reassigned"
      //     );
      //   }
      //   // Check if the business_location exists
      //   const businessLocationExists =
      //     await Business_location.findById(business_location).session(session);
      //   if (!businessLocationExists) {
      //     throw new ApiError(404, "business Location   not found");
      //   }
      //   // Create a new assigned order record
      //   const assignedOrder = new AssignedOrder({
      //     order: order_id,
      //     business_location: business_location,
      //     assignedAt: new Date(),
      //   });
      //   await assignedOrder.save({ session });
      //   order.is_assigned_to_business_location = true;
      //   order.assigned_business_location = business_location;
      //   await order.save({ session });
      //   // reduce product stock from business_location inventory
      //   // Todo add fifo stock reduce inventory movement
      //   for (const product of order.products) {
      //     const variantId = product?.selected_variant?._id;
      //     const productId = product.product; // Added: Extract productId for movements
      //     const quantity = product.total_quantity;
      //     // Find variant by barcode (assuming unique)
      //     const variant = await Variants.findById(variantId).session(session);
      //     if (!variant) {
      //       throw new ApiError(
      //         404,
      //         `Variant not found for barcode ${product?.selected_variant?.barcode}`
      //       );
      //     }

      //     await ReservedOrderQuantity.findOneAndUpdate(
      //       {
      //         product: productId,
      //         variant: variant._id,
      //         order: order_id,
      //       },
      //       {
      //         reserved: 0,
      //       }
      //     ).session(session);
      //     // console.log({variantId})
      //     // Find stock record
      //     const stock = await StocksModel.findOne({
      //       product: productId,
      //       variant: variantId,
      //       business_location: business_location,
      //     }).session(session);

      //     if (!stock || stock.available_quantity < quantity) {
      //       throw new ApiError(
      //         400,
      //         `Insufficient stock for barcode ${product?.selected_variant?.barcode}. Available: ${stock?.available_quantity || 0}, Requested: ${quantity}`
      //       );
      //     }

      //     // Find active, non-expired lots sorted by received_at (FIFO)
      //     const lots = await LotsModel.find({
      //       stock: stock._id,
      //       status: "active",
      //       qty_available: { $gt: 0 },
      //       // $or: [{ expiry_date: null }, { expiry_date: { $gt: new Date() } }],
      //     })
      //       .sort({ received_at: 1 })
      //       .session(session);

      //     let remaining = quantity;
      //     let item_cost = 0;

      //     for (const lot of lots) {
      //       if (remaining <= 0) break;
      //       const alloc = Math.min(remaining, lot.qty_available);
      //       item_cost += alloc * lot.cost_per_unit;

      //       // Update lot
      //       const update: any = {
      //         $inc: { qty_available: -alloc },
      //       };
      //       if (alloc === lot.qty_available) {
      //         update.status = "closed";
      //       }
      //       await LotsModel.findByIdAndUpdate(lot._id, update, { session });

      //       // Added: Create inventory movement for pos_sale (per allocation)
      //       await InventoryMovementModel.create(
      //         [
      //           {
      //             type: "pos_sale",
      //             ref: order._id, // Reference to the Order
      //             variant: variantId,
      //             product: productId,
      //             business_location: business_location,
      //             qty: -alloc, // Negative for sale (out)
      //             cost_per_unit: lot.cost_per_unit,
      //             lot: lot._id, // Source lot
      //             note: `sold via Online order, invoice ${order.invoice_number}`,
      //           },
      //         ],
      //         { session }
      //       );

      //       remaining -= alloc;
      //     }

      //     if (remaining > 0) {
      //       throw new ApiError(
      //         400,
      //         `Insufficient available lots for barcode ${product?.selected_variant?.barcode} despite stock record`
      //       );
      //     }

      //     // Update stock
      //     await StocksModel.findByIdAndUpdate(
      //       stock._id,
      //       {
      //         $inc: {
      //           available_quantity: -quantity,
      //           total_sold: quantity,
      //         },
      //       },
      //       { session }
      //     );
      //   }
      // }

      const courierPayload: TCourierPayload = {
        invoice: order?.invoice_number,
        recipient_name: order?.customer_name as string,
        recipient_phone: order?.customer_number as string,
        recipient_address: `${order?.delivery_address?.local_address}, Upazila: ${order?.delivery_address?.thana}, District: ${order?.delivery_address?.district}`,
        cod_amount: order?.payable_amount || 0,
        ...(note && { note: note }),
      };

      const courierRes: any =
        await CourierMiddleware.transfer_single_order(courierPayload);

      //   console.log(courierRes, "courierRes");

      if (courierRes?.statusCode === 200 || courierRes?.status === 200) {
        // console.log("Courier transfer successful");
        // Handle successful courier response
        const existing = await CourierModel.findOne({
          order: order_id,
        }).session(session);
        if (existing) {
          throw new ApiError(
            409,
            "Courier record already exists for this order"
          );
        }

        // console.log(courierRes?.consignment, "parcel id");
        const [createdCourier] = await CourierModel.create(
          [
            {
              merchant: marchant ?? MARCHANT.STEAD_FAST,
              consignment_id: courierRes?.consignment?.consignment_id,
              tracking_id: courierRes?.consignment?.tracking_code,
              booking_date: courierRes?.consignment?.created_at
                ? new Date(courierRes.consignment.created_at)
                : new Date(),
              courier_note: courierRes?.consignment?.note,
              cod_amount: courierRes?.consignment?.cod_amount,
              order: order_id,
              status: ORDER_STATUS.HANDED_OVER_TO_COURIER,
              transfer_to_courier: true,
            },
          ],
          { session }
        );
        // console.log(createdCourier, "createdCourier");

        if (!createdCourier) {
          throw new ApiError(500, "Failed to create courier record");
        }

        const result = await OrderModel.findByIdAndUpdate(
          order_id,
          {
            order_status: ORDER_STATUS.HANDED_OVER_TO_COURIER,
            transfer_to_courier: true,
            courier: createdCourier._id,
          },
          { new: true, session }
        );

        await session.commitTransaction();
        return result;
      } else {
        throw new ApiError(400, "Failed to transfer order to courier");
      }
    } catch (error: any) {
      console.log(error, "error");
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async scanToShipping(
    id: string,
    note: string = "Order transferred to courier",
    marchant: string
  ) {
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findOne({
        order_id: id,
      })
        .populate("user")
        .session(session);

      if (!order) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
      } else if (
        !order ||
        order.order_status === ORDER_STATUS.CANCELLED ||
        order.order_status === ORDER_STATUS.FAILED ||
        order.order_status === ORDER_STATUS.DELIVERED ||
        !marchant
      ) {
        throw new ApiError(
          HttpStatusCode.UNAUTHORIZED,
          `you can't transfer this order status ${order ? order.order_status : "unknown"} to courier`
        );
      }

      const order_id = order._id;

      // if (business_location) {
      //   // Check if the order is already assigned to an business_location
      //   if (order.is_assigned_to_business_location) {
      //     throw new ApiError(
      //       400,
      //       "Order is already assigned to an business_location and cannot be reassigned"
      //     );
      //   }
      //   // Check if the business_location exists
      //   const businessLocationExists =
      //     await Business_location.findById(business_location).session(session);
      //   if (!businessLocationExists) {
      //     throw new ApiError(404, "business Location   not found");
      //   }
      //   // Create a new assigned order record
      //   const assignedOrder = new AssignedOrder({
      //     order: order_id,
      //     business_location: business_location,
      //     assignedAt: new Date(),
      //   });
      //   await assignedOrder.save({ session });
      //   order.is_assigned_to_business_location = true;
      //   order.assigned_business_location = business_location;
      //   await order.save({ session });
      //   // reduce product stock from business_location inventory
      //   // Todo add fifo stock reduce inventory movement
      //   for (const product of order.products) {
      //     const variantId = product?.selected_variant?._id;
      //     const productId = product.product; // Added: Extract productId for movements
      //     const quantity = product.total_quantity;
      //     // Find variant by barcode (assuming unique)
      //     const variant = await Variants.findById(variantId).session(session);
      //     if (!variant) {
      //       throw new ApiError(
      //         404,
      //         `Variant not found for barcode ${product?.selected_variant?.barcode}`
      //       );
      //     }

      //     await ReservedOrderQuantity.findOneAndUpdate(
      //       {
      //         product: productId,
      //         variant: variant._id,
      //         order: order_id,
      //       },
      //       {
      //         reserved: 0,
      //       }
      //     ).session(session);
      //     // console.log({variantId})
      //     // Find stock record
      //     const stock = await StocksModel.findOne({
      //       product: productId,
      //       variant: variantId,
      //       business_location: business_location,
      //     }).session(session);

      //     if (!stock || stock.available_quantity < quantity) {
      //       throw new ApiError(
      //         400,
      //         `Insufficient stock for barcode ${product?.selected_variant?.barcode}. Available: ${stock?.available_quantity || 0}, Requested: ${quantity}`
      //       );
      //     }

      //     // Find active, non-expired lots sorted by received_at (FIFO)
      //     const lots = await LotsModel.find({
      //       stock: stock._id,
      //       status: "active",
      //       qty_available: { $gt: 0 },
      //       // $or: [{ expiry_date: null }, { expiry_date: { $gt: new Date() } }],
      //     })
      //       .sort({ received_at: 1 })
      //       .session(session);

      //     let remaining = quantity;
      //     let item_cost = 0;

      //     for (const lot of lots) {
      //       if (remaining <= 0) break;
      //       const alloc = Math.min(remaining, lot.qty_available);
      //       item_cost += alloc * lot.cost_per_unit;

      //       // Update lot
      //       const update: any = {
      //         $inc: { qty_available: -alloc },
      //       };
      //       if (alloc === lot.qty_available) {
      //         update.status = "closed";
      //       }
      //       await LotsModel.findByIdAndUpdate(lot._id, update, { session });

      //       // Added: Create inventory movement for pos_sale (per allocation)
      //       await InventoryMovementModel.create(
      //         [
      //           {
      //             type: "pos_sale",
      //             ref: order._id, // Reference to the Order
      //             variant: variantId,
      //             product: productId,
      //             business_location: business_location,
      //             qty: -alloc, // Negative for sale (out)
      //             cost_per_unit: lot.cost_per_unit,
      //             lot: lot._id, // Source lot
      //             note: `sold via Online order, invoice ${order.invoice_number}`,
      //           },
      //         ],
      //         { session }
      //       );

      //       remaining -= alloc;
      //     }

      //     if (remaining > 0) {
      //       throw new ApiError(
      //         400,
      //         `Insufficient available lots for barcode ${product?.selected_variant?.barcode} despite stock record`
      //       );
      //     }

      //     // Update stock
      //     await StocksModel.findByIdAndUpdate(
      //       stock._id,
      //       {
      //         $inc: {
      //           available_quantity: -quantity,
      //           total_sold: quantity,
      //         },
      //       },
      //       { session }
      //     );
      //   }
      // }

      const courierPayload: TCourierPayload = {
        invoice: order?.invoice_number,
        recipient_name: order?.customer_name as string,
        recipient_phone: order?.customer_number as string,
        recipient_address: `${order?.delivery_address?.local_address}, Upazila: ${order?.delivery_address?.thana}, District: ${order?.delivery_address?.district}`,
        cod_amount: order?.payable_amount || 0,
        ...(note && { note: note }),
      };

      const courierRes: any =
        await CourierMiddleware.transfer_single_order(courierPayload);

      //   console.log(courierRes, "courierRes");

      if (courierRes?.statusCode === 200 || courierRes?.status === 200) {
        // console.log("Courier transfer successful");
        // Handle successful courier response
        const existing = await CourierModel.findOne({
          order: order_id,
        }).session(session);
        if (existing) {
          throw new ApiError(
            409,
            "Courier record already exists for this order"
          );
        }

        const [createdCourier] = await CourierModel.create(
          [
            {
              merchant: marchant ?? MARCHANT.STEAD_FAST,
              consignment_id: courierRes?.consignment?.consignment_id,
              tracking_id: courierRes?.consignment?.tracking_code,
              booking_date: courierRes?.consignment?.created_at
                ? new Date(courierRes.consignment.created_at)
                : new Date(),
              courier_note: courierRes?.consignment?.note,
              cod_amount: courierRes?.consignment?.cod_amount,
              order: order_id,
              status: ORDER_STATUS.HANDED_OVER_TO_COURIER,
              transfer_to_courier: true,
            },
          ],
          { session }
        );
        // console.log(createdCourier, "createdCourier");

        if (!createdCourier) {
          throw new ApiError(500, "Failed to create courier record");
        }

        const result = await OrderModel.findByIdAndUpdate(
          order_id,
          {
            order_status: ORDER_STATUS.HANDED_OVER_TO_COURIER,
            transfer_to_courier: true,
            courier: createdCourier._id,
          },
          { new: true, session }
        );

        await session.commitTransaction();
        return result;
      } else {
        throw new ApiError(400, "Failed to transfer order to courier");
      }
    } catch (error: any) {
      console.log(error, "error");
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async scanToReturn(id: string) {
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findOne({
        order_id: id,
      })
        .populate("user")
        .session(session);

      if (!order) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
      }
      if (order.order_status === ORDER_STATUS.RETURNED) {
        throw new ApiError(400, `Order is Already returned`);
      }
      order.order_status = ORDER_STATUS.RETURNED;

      // stock update logic here
      const pairs = this.extractProductVariantQuantity(order);

      for (const { product, variant, quantity, lot } of pairs) {
        // Stock check, deduct, or update operations
        const stock = await StockModel.findOne(
          {
            product: product,
            variant: variant,
          },
          null,
          { session }
        );
        if (!stock) {
          throw new ApiError(404, "Stock record not found");
        }
        stock.available_quantity += quantity;
        // lot update
        const lotRecord = await LotModel.findById(lot).session(session);
        if (!lotRecord) {
          throw new ApiError(404, "Lot record not found");
        }
        lotRecord.qty_available += quantity;
        await stock.save({ session });
      }
      (await order.save()).$session();
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in scanToReturn:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async statusByTrackingCode(order_id: string) {
    // Start a session for transaction
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findById(order_id)
        .populate("user")
        .session(session);
      if (!order) {
        throw new ApiError(404, "Invalid order id");
      }

      // Ensure certain statuses can't proceed to courier tracking
      if (
        order.order_status === ORDER_STATUS.INCOMPLETE ||
        order.order_status === ORDER_STATUS.CANCELLED ||
        order.order_status === ORDER_STATUS.RETURNED ||
        order.order_status === ORDER_STATUS.DELIVERED ||
        !order.transfer_to_courier
      ) {
        throw new ApiError(
          400,
          `Order cannot be transferred to the courier due to its current status: ${order.order_status}`
        );
      }
      const courier = await CourierModel.findOne({ order: order_id }).session(
        session
      );
      const trackingRes: any = await CourierMiddleware.status_by_tracking_code(
        courier?.tracking_id as string
      );

      if (trackingRes?.status === 200) {
        let customStatus = ORDER_STATUS.IN_TRANSIT;
        switch (trackingRes?.delivery_status) {
          case "hold":
          case "in_review":
            customStatus = ORDER_STATUS.HANDED_OVER_TO_COURIER;
            break;
          case "pending":
            customStatus = ORDER_STATUS.PENDING;
            break;
          case "picked":
            customStatus = ORDER_STATUS.IN_TRANSIT;
            break;

          case "partial_delivered_approval_pending":
          case "partial_delivered":
            customStatus = ORDER_STATUS.PENDING_RETURN;
            break;
          case "delivered_approval_pending":
          case "delivered":
            customStatus = ORDER_STATUS.DELIVERED;
            break;

          case "cancelled":
          case "cancelled_approval_pending":
            customStatus = ORDER_STATUS.CANCELLED;
            break;
          case "unknown":
          case "unknown_approval_pending":
            customStatus = ORDER_STATUS.UNKNOWN;
            break;
          default:
            throw new ApiError(400, "Unknown delivery status received");
        }

        order.order_status = customStatus as IOrderStatus;
        await order.save({ session });

        // if (customStatus === ORDER_STATUS.DELIVERED && order?.user) {
        //   const totalCoins = order?.products?.reduce(
        //     (total, product) => total + (product.coin_per_order || 0),
        //     0
        //   );

        //   const user = await User.findByIdAndUpdate(
        //     { _id: order.user },
        //     {
        //       $inc: {
        //         available_coins: totalCoins,
        //         completed_orders: 1,
        //         incomplete_orders: -1,
        //       },
        //     },
        //     { new: true, session }
        //   );

        //   if (!user) {
        //     throw new ApiError(404, "User not found");
        //   }
        // }

        await session.commitTransaction();
        return {
          courier_status: trackingRes?.delivery_status,
          order_status: customStatus,
        };
      } else {
        throw new ApiError(400, "Failed to fetch status by tracking code");
      }
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handlePendingReturns(order_id: string, variants_ids: string[]) {
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findById(order_id)
        .populate("user")
        .session(session);
      if (!order) {
        throw new ApiError(404, "Invalid order id");
      } else if (order.order_status !== ORDER_STATUS.PENDING_RETURN) {
        throw new ApiError(400, `Order is not in pending return status`);
      }

      // items status update logic here
      const itemStatusQuantities =
        await this.extractItemStatusQuantityByVariantIds(
          order,
          variants_ids,
          session
        );

      for (const {
        product,
        variant,
        status,
        quantity,
      } of itemStatusQuantities) {
        console.log(
          `Product: ${product}, Variant: ${variant}, Status: ${status}, Quantity: ${quantity}`
        );

        const stock = await StockModel.findOne(
          {
            product: product,
            variant: variant,
          },
          null,
          { session }
        );
        if (!stock) {
          throw new ApiError(404, "Stock record not found");
        }
        stock.available_quantity += quantity;
        await stock.save({ session });
      }

      // stock update logic here

      order.order_status = ORDER_STATUS.PARTIAL;
      await order.save({ session });
      await session.commitTransaction();
      return order;
    } catch (error: any) {
      console.log(error, "error");
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // enrich products with details
  private extractProductVariantQuantity(
    orderData: any
  ): { product: string; variant: string; quantity: number; lot: string }[] {
    if (!orderData.items || !Array.isArray(orderData.items)) return [];

    return orderData.items.map((item: any) => ({
      product:
        typeof item.product === "object" && item.product.$oid
          ? item.product.$oid
          : item.product,
      variant:
        typeof item.variant === "object" && item.variant.$oid
          ? item.variant.$oid
          : item.variant,
      quantity:
        typeof item.quantity === "object" && item.quantity.$numberInt
          ? Number(item.quantity.$numberInt)
          : item.quantity,
      lot: item.lot._id ? item.lot._id : item.lot,
    }));
  }

  private async extractItemStatusQuantityByVariantIds(
    order: IOrder,
    variant_ids: string[],
    session: any
  ): Promise<
    { product: string; variant: string; status: string; quantity: number }[]
  > {
    if (!order) {
      throw new Error("Valid order object is required");
    }

    if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
      throw new Error("Variant IDs must be a non-empty array");
    }

    // normalize variant ids
    const normalizedIds = variant_ids.map((id) => id.toString());

    // যদি order.items না থাকে
    if (!order.items || order.items.length === 0) {
      throw new Error("Order has no items");
    }

    const matchedItems: any[] = [];

    order.items.forEach((item: any) => {
      const variantId = item.variant?.toString();
      if (normalizedIds.includes(variantId)) {
        // status change
        item.status = ORDER_STATUS.RETURNED;
        matchedItems.push(item);
      }
    });

    if (matchedItems.length === 0) {
      throw new Error("No matching variants found in this order");
    }

    await OrderModel.updateOne(
      { _id: order.id },
      {
        $set: {
          items: order.items,
        },
      }
    ).session(session);

    // Return updated info (product + variant + status + quantity)
    const updatedItems = matchedItems.map((item: any) => ({
      product: item.product?.toString(),
      variant: item.variant?.toString(),
      status: item.status,
      quantity:
        typeof item.quantity === "object" && item.quantity.$numberInt
          ? Number(item.quantity.$numberInt)
          : item.quantity,
    }));

    return updatedItems;
  }
}

export const CourierService = new Service();
