import mongoose, { Types } from "mongoose";
import { CartService } from "../cart/cart.service";
import { IOrder, IOrderItem, IOrderPlace } from "./order.interface";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ICartItem } from "../cart/cart.interface";
import { InvoiceService } from "@/lib/invoice";
import { CounterModel } from "@/common/models/counter.model";
import { OrderModel } from "./order.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { BkashService } from "../bkash/bkash.service";
import { ORDER_STATUS, PAYMENT_STATUS } from "./order.enums";
import { ProductModel } from "../product/product.model";
import { OrderQuery } from "@/interfaces/common.interface";
import { StockModel } from "../stock/stock.model";
import { VariantModel } from "../variant/variant.model";
import { CourierMiddleware } from "../courier/courier.middleware";
import { TCourierPayload } from "../courier/courier.interface";

class Service {
  async placeOrder(
    data: IOrderPlace
  ): Promise<{ order: IOrder[]; payment_url: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // retrieve user cart
      const enrichedOrder = await this.enrichProducts(data);
      // enrichedOrder
      // console.log(JSON.stringify(enrichedOrder, null, 2), "enriched order");

      // const cartItems = await CartService.getCartByUser(
      //   data.user_id as Types.ObjectId
      // );
      if (enrichedOrder?.length <= 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Your cart is empty, cannot place order"
        );
      }

      // console.log(cartItems, "cart items");

      // check stock availability [most important]
      for (const item of enrichedOrder.products) {
        // console.log(item.variant, "for stock");
        const stock = await StockModel.findOne(
          {
            product: item.product,
            variant: item.variant,
          },
          null,
          { session }
        );

        if (!stock || stock.available_quantity < item.quantity) {
          // সেশন বাতিল করুন
          // await session.abortTransaction();
          session.endSession();
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name} is out of stock or does not have enough quantity`
          );
        }

        // স্টক থেকে quantity বাদ দিন এবং session সহ save করুন
        stock.available_quantity -= item.quantity;
        await stock.save({ session });
        // console.log(stock, "stock");
      }

      //  stock reduction will be done after payment confirmation

      // 2. Calculate totals
      const { total_price, items, total_items } =
        await this.calculateCart(enrichedOrder);

      // 3. Generate invoice and order id
      const order_id = await this.generateOrderId(session);
      const invoice_number = await InvoiceService.generateInvoiceNumber(
        order_id,
        session
      );

      // 4. Build payload
      const payload: IOrder = {
        user: data.user_id as Types.ObjectId,
        items,
        total_items,
        total_price,
        total_amount: total_price,
        payable_amount: 0, // will be updated later
        delivery_address: data.delivery_address,
        invoice_number,
        order_id,
        payment_type: data.payment_type,
        payment_status: PAYMENT_STATUS.PENDING,
        order_at: new Date(),
        order_status: ORDER_STATUS.PENDING,
      };

      if (data?.tax && data?.tax > 0) {
        data.tax = Number(data?.tax.toFixed());
        payload.total_amount += data.tax;
      }

      if (data?.discounts && data?.discounts > 0) {
        data.discounts = Number(data?.discounts.toFixed());
        payload.total_amount -= data.discounts;
      }

      data.delivery_charge = this.calculateDeliveryCharge(
        data.delivery_address.division
      );

      // dakha 70TK OUT SIDE DELIVERY CHARGE 120 TK
      if (data?.delivery_charge && data?.delivery_charge > 0) {
        data.delivery_charge = Number(data?.delivery_charge.toFixed());
        payload.total_amount += data.delivery_charge;
        payload.delivery_charge = data.delivery_charge;
      }

      if (data.payment_type === "cod") {
        payload.payment_status = PAYMENT_STATUS.PENDING;
        payload.payable_amount = payload.total_amount;
        payload.order_status = ORDER_STATUS.PENDING;
      }

      // create payment first
      const { payment_id, payment_url: bkash_payment_url } =
        await BkashService.createPayment({
          payable_amount: payload.total_amount,
          invoice_number: payload.invoice_number,
        });

      payload.payment_id = payment_id;
      payload.total_amount = Number(payload.total_amount.toFixed());

      // 5. Create order (with session)
      const createdOrders = await OrderModel.create([payload], { session });

      if (!createdOrders || createdOrders.length <= 0) {
        throw new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          "Failed to create order"
        );
      }
      // const createdOrder = createdOrders[0];
      // console.log(createdOrder);

      // 6. Clear cart (with session)
      await CartService.clearCartAfterCheckout(
        data.user_id as Types.ObjectId,
        session
      );

      // 7. Commit transaction
      await session.commitTransaction();
      session.endSession();

      const payment_url =
        data.payment_type === "bkash" ? bkash_payment_url : "";

      const populatedOrders = await OrderModel.find({
        _id: { $in: createdOrders.map((order) => order._id) },
      })
        .populate({
          path: "items.product",
          select: "name slug sku thumbnail description", // প্রয়োজনীয় product ফিল্ড
        })
        .populate({
          path: "items.variant",
          select:
            "attributes attribute_values regular_price sale_price sku barcode image", // প্রয়োজনীয় variant ফিল্ড
        });

      return { order: populatedOrders, payment_url };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async updatePaymentStatus(
    payment_id: string,
    transaction_id: string,
    status: PAYMENT_STATUS
  ) {
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { payment_id },
      { $set: { payment_status: status, transaction_id } },
      { new: true }
    );

    if (!updatedOrder) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with payment id: ${payment_id}`
      );
    }

    console.log(`Order status updated for payment id: ${payment_id}`);
  }

  // get order by id
  async getOrderById(id: string): Promise<IOrder | null> {
    // শুধু id দিন, {_id: id} নয়
    const order = await OrderModel.findById(id)
      .populate({
        path: "user", // কোন ফিল্ড populate হবে
        select: "name phone_number email _id", // শুধু এই ফিল্ডগুলো আনবে
      })
      .populate({
        path: "items.product", // items array-র প্রতিটি product ObjectId-কে populate করবে
        select: "name slug sku thumbnail description", // যেসব ফিল্ড আনবেন
      })
      .populate({
        path: "items.variant", // items array-র প্রতিটি variant ObjectId-কে populate করবে
        select:
          "attributes attribute_values regular_price sale_price sku barcode image", // যেসব ফিল্ড আনবেন
      });

    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${id}`
      );
    }

    return order;
  }

  // get orders for admin with pagination, filter, search, sort, date range etc.
  // get orders for user with pagination, filter, search, sort, date range etc.
  async getOrders(query: OrderQuery): Promise<{
    meta: { page: number; limit: number; total: number };
    data: IOrder[];
  }> {
    const {
      page = "1",
      limit = "10",
      start_date,
      end_date,
      status,
      phone,
      order_id,
    } = query;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Filter conditions
    const matchStage: any = {};

    // Date range (order_at)
    if (start_date || end_date) {
      matchStage.order_at = {};
      if (start_date) matchStage.order_at.$gte = new Date(start_date);
      if (end_date) matchStage.order_at.$lte = new Date(end_date);
    }

    // Status
    if (status) {
      matchStage.order_status = status;
    }

    // Phone (delivery_address.phone_number)
    if (phone) {
      matchStage["delivery_address.phone_number"] = phone;
    }

    // Order ID (number or string)
    if (order_id) {
      if (!isNaN(Number(order_id))) {
        matchStage.order_id = Number(order_id);
      } else {
        matchStage.order_id = order_id;
      }
    }

    // Only add $match if anything in it
    if (Object.keys(matchStage).length) {
      pipeline.push({ $match: matchStage });
    }

    // Sort by most recent orders (order_at desc)
    pipeline.push({ $sort: { order_at: -1 } });

    // ---------- Populate items.product ----------
    pipeline.push({
      $lookup: {
        from: "products", // products collection name
        localField: "items.product",
        foreignField: "_id",
        as: "productsDocs",
      },
    });

    pipeline.push({
      $lookup: {
        from: "user", // products collection name
        localField: "user",
        foreignField: "_id",
        as: "productsDocs",
      },
    });

    // ---------- Populate items.product ----------
    pipeline.push({
      $lookup: {
        from: "products", // products collection name
        localField: "items.product",
        foreignField: "_id",
        as: "productsDocs",
      },
    });

    // ---------- Populate user ----------
    pipeline.push({
      $lookup: {
        from: "users", // users collection name (must be plural, usually 'users')
        localField: "user",
        foreignField: "_id",
        as: "userDocs",
      },
    });

    // ---------- Populate items.variant ----------
    pipeline.push({
      $lookup: {
        from: "variants", // variants collection name
        localField: "items.variant",
        foreignField: "_id",
        as: "variantsDocs",
      },
    });

    // ---------- Merge populated product/variant into items array ----------
    pipeline.push({
      $addFields: {
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              $mergeObjects: [
                "$$item",
                {
                  product: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$productsDocs",
                          as: "prod",
                          cond: { $eq: ["$$item.product", "$$prod._id"] },
                        },
                      },
                      0,
                    ],
                  },
                  variant: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$variantsDocs",
                          as: "var",
                          cond: { $eq: ["$$item.variant", "$$var._id"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
        // ---------- Merge populated user (excluding password) ----------
        user: {
          $let: {
            vars: {
              userObj: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$userDocs",
                      as: "u",
                      cond: { $eq: ["$user", "$$u._id"] },
                    },
                  },
                  0,
                ],
              },
            },
            in: {
              _id: "$$userObj._id",
              name: "$$userObj.name",
              email: "$$userObj.email",
              phone: "$$userObj.phone",
              role: "$$userObj.role",
              status: "$$userObj.status",
              createdAt: "$$userObj.createdAt",
              updatedAt: "$$userObj.updatedAt",
              // password intentionally excluded
            },
          },
        },
      },
    });

    // ---------- Remove extra arrays ----------
    pipeline.push({
      $project: {
        productsDocs: 0,
        variantsDocs: 0,
        userDocs: 0,
      },
    });

    // Pagination
    const _page = Math.max(Number(page), 1);
    const _limit = Math.max(Number(limit), 1);
    pipeline.push({ $skip: (_page - 1) * _limit });
    pipeline.push({ $limit: _limit });

    // Run aggregation
    const orders = await OrderModel.aggregate(pipeline);
    const total = await OrderModel.countDocuments(matchStage);

    return {
      meta: { page: _page, limit: _limit, total },
      data: orders,
    };
  }

  // courier sevice integration
  async transferToCourier(
    order_id: string,
    payload: { note?: string; type?: "SINGLE" | "MULTIPLE" } = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    business_location?: Types.ObjectId
  ) {
    // Start a session for transaction
    const session = await OrderModel.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findOne({ _id: order_id })
        .populate("user")
        .session(session);

      if (!order) {
        throw new ApiError(404, "Invalid order id");
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
        ...(payload.note && { note: payload.note }),
      };

      const courierRes: any =
        await CourierMiddleware.transfer_single_order(courierPayload);

      if (courierRes?.status === 200) {
        const result = await OrderModel.findByIdAndUpdate(
          order_id,
          {
            status: ORDER_STATUS.HANDED_OVER_TO_COURIER,
            transfer_to_courier: true,
            $set: {
              consignment_id: courierRes?.consignment?.consignment_id,
              tracking_code: courierRes?.consignment?.tracking_code,
              confirmed_date: courierRes?.consignment?.created_at,
              courier_note: courierRes?.consignment?.note,
              cod_amount: courierRes?.consignment?.cod_amount,
            },
          },
          { new: true, session }
        );

        await session.commitTransaction();
        return result;
      } else {
        throw new ApiError(400, "Failed to transfer order to courier");
      }
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // order status update by admin
  async updateOrderStatus(
    order_id: string,
    status: ORDER_STATUS
  ): Promise<IOrder | null> {
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: order_id },
      { $set: { order_status: status } },
      { new: true }
    );

    if (!updatedOrder) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${order_id}`
      );
    }

    return updatedOrder;
  }

  // enrich products with details
  private async enrichProducts(orderData: any) {
    const enrichedProducts = await Promise.all(
      orderData.products.map(async (item: any) => {
        const productDetails = await ProductModel.findById(item.product).lean();
        return {
          ...item,
          product: productDetails,
        };
      })
    );
    return { ...orderData, products: enrichedProducts };
  }

  // calulate delivery charge
  private calculateDeliveryCharge(address: any): number {
    // Example logic: flat rate based on division
    // console.log(address, "address");
    const divisionCharges: { [key: string]: number } = {
      dhaka: 70,
      dhaka_division: 70,
      ঢাকা: 70,
      ঢাকা_বিভাগ: 70,
      Dhaka: 70,
      "ঢাকা বিভাগ": 70,

      // ঢাকা: 70,
      // ঢাকা বিভাগ: 70,
      // Chittagong: 80,
      // Khulna: 100,
      // Rajshahi: 100,
      // Barisal: 120,
      // Sylhet: 150,
      // Rangpur: 120,
      // Mymensingh: 100,
    };
    return divisionCharges[address.toLowerCase()] || 120; // default charge
  }

  private async generateOrderId(
    session: mongoose.ClientSession
  ): Promise<number> {
    const counter = await CounterModel.findOneAndUpdate(
      { name: "order_id" },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, session }
    );
    return counter.sequence;
  }

  private async calculateCart(items: any): Promise<{
    items: IOrderItem[];
    total_items: number;
    total_price: number;
  }> {
    let total_items = 0;
    let total_price = 0;

    // console.log(items, "items");

    const orderItems: IOrderItem[] = await Promise.all(
      items?.products.map(async (cartItem: any) => {
        const variant = await VariantModel.findById(cartItem.variant);

        const subtotal = (variant?.sale_price || 0) * cartItem.quantity;
        total_items += cartItem.quantity;
        total_price += subtotal;

        return {
          product: cartItem.product,
          variant: cartItem.variant,
          attributes: cartItem.attributes,
          quantity: cartItem.quantity,
          price: variant?.sale_price || 0,
          subtotal,
        };
      })
    );

    return {
      items: orderItems,
      total_items,
      total_price: Math.ceil(total_price),
    };
  }
}

export const OrderService = new Service();
