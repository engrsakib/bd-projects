import ApiError from "@/middlewares/error";
import { MARCHANT, TCourierPayload } from "./courier.interface";
import { OrderModel } from "../order/order.model";

import { CourierMiddleware } from "./courier.middleware";
import { ORDER_STATUS } from "../order/order.enums";
import CourierModel from "./courier.model";

class Service {
  // courier sevice integration
  async transferToCourier(
    order_id: string,
    note: string = "Order transferred to courier",
    marchant: string
  ) {
    // Start a session for transaction

    // console.log(order_id, "order_id");
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findOne({ _id: order_id })
        .populate("user")
        .session(session);

      if (
        !order ||
        order.order_status === ORDER_STATUS.CANCELLED ||
        order.order_status === ORDER_STATUS.FAILED ||
        order.order_status === ORDER_STATUS.DELIVERED ||
        !marchant
      ) {
        throw new ApiError(
          404,
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
        recipient_name: order?.delivery_address?.name as string,
        recipient_phone: order?.delivery_address?.phone_number as string,
        recipient_address: `${order?.delivery_address?.local_address}, Upazila: ${order?.delivery_address?.thana}, District: ${order?.delivery_address?.district}`,
        cod_amount: order?.payable_amount || 0,
        ...(note && { note: note }),
      };

      const courierRes: any =
        await CourierMiddleware.transfer_single_order(courierPayload);

      console.log(courierRes, "courierRes");

      if (courierRes?.statusCode === 200 || courierRes?.status === 200) {
        console.log("Courier transfer successful");
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
        console.log(createdCourier, "createdCourier");

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
}

export const CourierService = new Service();
