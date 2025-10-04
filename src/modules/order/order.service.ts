import mongoose, { Types } from "mongoose";
import { CartService } from "../cart/cart.service";
import { IOrder, IOrderBy, IOrderItem, IOrderPlace } from "./order.interface";
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
import { UserModel } from "../user/user.model";

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
          // await session.abortTransaction();
          session.endSession();
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name} is out of stock or does not have enough quantity`
          );
        }

        stock.available_quantity -= item.quantity;
        await stock.save({ session });
      }

      const { total_price, items, total_items } =
        await this.calculateCart(enrichedOrder);

      // 3. Generate invoice and order id
      const order_id = await this.generateOrderId(session);
      const invoice_number = await InvoiceService.generateInvoiceNumber(
        order_id,
        session
      );

      let role: IOrderBy = data.orders_by;
      if (data.user_id) {
        const user = await UserModel.findById(data.user_id);
        if (user) {
          role = user.role as IOrderBy;
        }
      }

      const order_by: IOrderBy = role ? role : "guest";

      const payload: IOrder = {
        user: data.user_id as Types.ObjectId,
        customer_name: data.customer_name,
        customer_number: data.customer_number,
        customer_secondary_number: data.customer_secondary_number,
        customer_email: data.customer_email,
        orders_by: order_by,

        items,
        total_items,
        total_price,
        total_amount: total_price,
        payable_amount: 0,
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
        data.delivery_address.division,
        data.delivery_address.district
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
        payload.order_status = ORDER_STATUS.PLACED;
      }

      if (data.payment_type === "bkash") {
        const { payment_id, payment_url: bkash_payment_url } =
          await BkashService.createPayment({
            payable_amount: payload.total_amount,
            invoice_number: payload.invoice_number,
          });

        payload.payment_id = payment_id;
        payload.total_amount = Number(payload.total_amount.toFixed());

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
            select: "name slug sku thumbnail description",
          })
          .populate({
            path: "items.variant",
            select:
              "attributes attribute_values regular_price sale_price sku barcode image",
          });

        return { order: populatedOrders, payment_url };
      }

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

      const populatedOrders = await OrderModel.find({
        _id: { $in: createdOrders.map((order) => order._id) },
      })
        .populate({
          path: "items.product",
          select: "name slug sku thumbnail description",
        })
        .populate({
          path: "items.variant",
          select:
            "attributes attribute_values regular_price sale_price sku barcode image",
        });

      return { order: populatedOrders, payment_url: "" };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // edit order
  async editOrder(
    orderId: string,
    data: IOrderPlace
  ): Promise<{ order: IOrder[]; payment_url: string }> {
    const session = await OrderModel.db.startSession();
    session.startTransaction();

    try {
      // 1. Retrieve existing order
      const existingOrder = await OrderModel.findById(orderId).session(session);
      if (!existingOrder) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
      }

      // 2. Enrich new products (merge with existing items)
      const enrichedOrder = await this.enrichProducts(data);

      if (!enrichedOrder?.products || enrichedOrder.products.length <= 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Order cannot be empty after edit"
        );
      }

      // 3. Check stock for new/updated products
      for (const item of enrichedOrder.products) {
        const stock = await StockModel.findOne(
          {
            product: item.product,
            variant: item.variant,
          },
          null,
          { session }
        );

        if (!stock || stock.available_quantity < item.quantity) {
          session.endSession();
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name} is out of stock or does not have enough quantity`
          );
        }

        // If quantity increased, reduce stock
        const prevItem = (existingOrder.items ?? []).find(
          (i) =>
            i.product.toString() === item.product._id.toString() &&
            i.variant?.toString() === item.variant?._id?.toString()
        );
        const prevQty = prevItem ? prevItem.quantity : 0;
        const deltaQty = item.quantity - prevQty;
        if (deltaQty > 0) {
          stock.available_quantity -= deltaQty;
          await stock.save({ session });
        }
      }

      // 4. Calculate new totals
      const { total_price, items, total_items } =
        await this.calculateCart(enrichedOrder);

      // 5. Update order fields
      if (data?.tax && data?.tax > 0) {
        data.tax = Number(data?.tax.toFixed());
        existingOrder.total_amount =
          total_price + data.tax - (data.discounts || 0);
      } else {
        existingOrder.total_amount = total_price - (data.discounts || 0);
      }

      if (data?.discounts && data?.discounts > 0) {
        data.discounts = Number(data?.discounts.toFixed());
        existingOrder.total_amount -= data.discounts;
      }

      data.delivery_charge = this.calculateDeliveryCharge(
        data.delivery_address.division,
        data.delivery_address.district
      );

      if (data?.delivery_charge && data?.delivery_charge > 0) {
        data.delivery_charge = Number(data?.delivery_charge.toFixed());
        existingOrder.total_amount += data.delivery_charge;
        existingOrder.delivery_charge = data.delivery_charge;
      }

      existingOrder.items = items;
      existingOrder.total_items = total_items;
      existingOrder.total_price = total_price;
      existingOrder.delivery_address = data.delivery_address;
      existingOrder.customer_name =
        data.customer_name || existingOrder.customer_name;
      existingOrder.customer_number =
        data.customer_number || existingOrder.customer_number;
      existingOrder.customer_secondary_number =
        data.customer_secondary_number ||
        existingOrder.customer_secondary_number;
      existingOrder.customer_email =
        data.customer_email || existingOrder.customer_email;

      // Payment handling (optional, depends on business logic)
      if (
        data.payment_type &&
        data.payment_type !== existingOrder.payment_type
      ) {
        existingOrder.payment_type = data.payment_type;
        if (data.payment_type === "bkash") {
          const { payment_id, payment_url: bkash_payment_url } =
            await BkashService.createPayment({
              payable_amount: existingOrder.total_amount,
              invoice_number: existingOrder.invoice_number,
            });

          existingOrder.payment_id = payment_id;
          // payment_url will be returned at end
          existingOrder.payment_status = PAYMENT_STATUS.PAID;
          existingOrder.payable_amount = 0;
          const populatedOrders = await OrderModel.find({
            _id: existingOrder._id,
          })
            .populate({
              path: "items.product",
              select: "name slug sku thumbnail description",
            })
            .populate({
              path: "items.variant",
              select:
                "attributes attribute_values regular_price sale_price sku barcode image",
            });

          return { order: populatedOrders, payment_url: bkash_payment_url };
        }
      }

      // status handling
      existingOrder.order_status = ORDER_STATUS.PLACED;

      await existingOrder.save({ session });

      // Optionally clear user's cart (if logic requires)
      await CartService.clearCartAfterCheckout(
        existingOrder.user as Types.ObjectId,
        session
      );

      await session.commitTransaction();
      session.endSession();

      const populatedOrders = await OrderModel.find({
        _id: existingOrder._id,
      })
        .populate({
          path: "items.product",
          select: "name slug sku thumbnail description",
        })
        .populate({
          path: "items.variant",
          select:
            "attributes attribute_values regular_price sale_price sku barcode image",
        });

      return {
        order: populatedOrders,
        payment_url: "",
      };
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
    const order = await OrderModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },

      // Product lookup
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productsData",
        },
      },
      // Variant lookup
      {
        $lookup: {
          from: "variants",
          localField: "items.variant",
          foreignField: "_id",
          as: "variantsData",
        },
      },

      // Admins lookup for logs
      {
        $lookup: {
          from: "admins",
          localField: "logs.user",
          foreignField: "_id",
          as: "logUsers",
        },
      },

      // Enrich items.product and items.variant with populated data
      {
        $addFields: {
          items: {
            $map: {
              input: {
                $sortArray: { input: "$items", sortBy: { _id: 1 } },
              },
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  {
                    product: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$productsData",
                            as: "pd",
                            cond: { $eq: ["$$pd._id", "$$item.product"] },
                          },
                        },
                        0,
                      ],
                    },
                    variant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$variantsData",
                            as: "vd",
                            cond: { $eq: ["$$vd._id", "$$item.variant"] },
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
        },
      },

      // Enrich logs with admin data
      {
        $addFields: {
          logs: {
            $map: {
              input: {
                $sortArray: { input: "$logs", sortBy: { time: -1 } },
              },
              as: "log",
              in: {
                _id: "$$log._id",
                time: "$$log.time",
                action: "$$log.action",
                user: {
                  $let: {
                    vars: {
                      u: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$logUsers",
                              as: "lu",
                              cond: { $eq: ["$$lu._id", "$$log.user"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$u._id",
                      name: "$$u.name",
                      image: "$$u.image",
                      phone_number: "$$u.phone_number",
                      email: "$$u.email",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    if (!order || !order[0]) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${id}`
      );
    }

    return order[0] as IOrder;
  }

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
      orders_by,
    } = query;

    const pipeline: any[] = [];
    const matchStage: any = {};

    if (start_date || end_date) {
      matchStage.order_at = {};
      if (start_date) matchStage.order_at.$gte = new Date(start_date);
      if (end_date) matchStage.order_at.$lte = new Date(end_date);
    }

    // status as array support
    if (status) {
      // accept: status = ["pending", "delivered"] or status = "pending"
      if (Array.isArray(status)) {
        matchStage.order_status = { $in: status };
      } else {
        // if comma separated string: "pending,delivered"
        if (typeof status === "string" && status.includes(",")) {
          matchStage.order_status = {
            $in: status.split(",").map((s) => s.trim()),
          };
        } else {
          matchStage.order_status = status;
        }
      }
    }

    if (phone) {
      matchStage["delivery_address.phone_number"] = phone;
    }

    if (order_id) {
      if (!isNaN(Number(order_id))) {
        matchStage.order_id = Number(order_id);
      } else {
        matchStage.order_id = order_id;
      }
    }

    if (Object.keys(matchStage).length) {
      pipeline.push({ $match: matchStage });
    }

    if (orders_by) {
      const [field, direction = "desc"] = orders_by.split(":");
      pipeline.push({ $sort: { [field]: direction === "asc" ? 1 : -1 } });
    } else {
      pipeline.push({ $sort: { order_at: -1 } });
    }

    // ---------- Populate items.product ----------
    pipeline.push({
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productsDocs",
      },
    });

    // ---------- Populate items.variant ----------
    pipeline.push({
      $lookup: {
        from: "variants",
        localField: "items.variant",
        foreignField: "_id",
        as: "variantsDocs",
      },
    });

    // ---------- Populate user OR admin ----------
    const lookupCollection = orders_by === "admin" ? "admins" : "users";

    pipeline.push({
      $lookup: {
        from: lookupCollection,
        localField: "user",
        foreignField: "_id",
        as: "userDocs",
      },
    });

    pipeline.push({
      $unwind: {
        path: "$userDocs",
        preserveNullAndEmptyArrays: true,
      },
    });

    // ---------- Merge populated product/variant/user ----------
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
        user: {
          _id: "$userDocs._id",
          name: "$userDocs.name",
          email: "$userDocs.email",
          phone: "$userDocs.phone",
          role: "$userDocs.role",
          status: "$userDocs.status",
          createdAt: "$userDocs.createdAt",
          updatedAt: "$userDocs.updatedAt",
        },
      },
    });

    pipeline.push({
      $project: {
        productsDocs: 0,
        variantsDocs: 0,
        userDocs: 0,
      },
    });

    const _page = Math.max(Number(page), 1);
    const _limit = Math.max(Number(limit), 1);
    pipeline.push({ $skip: (_page - 1) * _limit });
    pipeline.push({ $limit: _limit });

    const orders = await OrderModel.aggregate(pipeline);
    const total = await OrderModel.countDocuments(matchStage);

    return {
      meta: { page: _page, limit: _limit, total },
      data: orders,
    };
  }

  // delete order by id
  async deleteOrder(id: string): Promise<void> {
    const deletedOrder = await OrderModel.findByIdAndDelete(id);
    if (!deletedOrder) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${id}`
      );
    }
  }

  async updateOrderStatus(
    order_id: string,
    user_id: string,
    status: ORDER_STATUS
  ): Promise<IOrder | null> {
    const order = await OrderModel.findById(order_id);
    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${order_id}`
      );
    }

    const previousStatus = order.order_status || "N/A";

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: order_id },
      {
        $set: { order_status: status },
        $push: {
          logs: {
            user: user_id,
            time: new Date(),
            action: `ORDER_STATUS_UPDATED: ${previousStatus} -> ${status}`,
          },
        },
      },
      { new: true }
    );

    return updatedOrder;
  }

  async order_tracking(order_id: string) {
    const order = await OrderModel.findOne({ order_id })
      .populate({
        path: "items.product",
        select: "name slug sku thumbnail description",
      })
      .populate({
        path: "items.variant",
        select:
          "attributes attribute_values regular_price sale_price sku barcode image",
      });

    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${order_id}`
      );
    }

    return {
      order_status: order.order_status,
      order_id: order.order_id,
      product: order.items,
      invoice_number: order.invoice_number,
      payment_status: order.payment_status,
      payment_type: order.payment_type,
      total_amount: order.total_amount,
      order_at: order.order_at,
    };
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
  private calculateDeliveryCharge(division: any, district: any): number {
    const dhakaDivisions = [
      "dhaka",
      "dhaka_division",
      "ঢাকা",
      "ঢাকা_বিভাগ",
      "Dhaka",
      "ঢাকা বিভাগ",
    ];
    const dhakaDistricts = ["dhaka", "ঢাকা", "Dhaka"];

    const div = division.toLowerCase().trim();
    const dist = district.toLowerCase().trim();

    const isDhakaDivision = dhakaDivisions.some((d) => d.toLowerCase() === div);
    const isDhakaDistrict = dhakaDistricts.some(
      (d) => d.toLowerCase() === dist
    );

    if (isDhakaDivision && isDhakaDistrict) return 70;
    if (isDhakaDivision && !isDhakaDistrict) return 100;
    return 120;
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
