import mongoose, { Types } from "mongoose";
import { CartService } from "../cart/cart.service";
import {
  IOrder,
  IOrderBy,
  IOrderItem,
  IOrderPlace,
  IOrderStatus,
  Istatus_count,
} from "./order.interface";
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
import { LotModel } from "../lot/lot.model";

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

        // lot consumption (FIFO)
        const consumedLots = await this.consumeLotsFIFO(
          item.product,
          item.variant,
          item.quantity,
          session
        );
        item.lots = consumedLots;
        // console.log(consumedLots, "consumed lots `");

        stock.available_quantity -= item.quantity;
        stock.total_sold = (stock.total_sold || 0) + item.quantity;
        item.total_sold = (item.total_sold || 0) + item.quantity;
        await stock.save({ session });
      }

      console.log(
        JSON.stringify(enrichedOrder.products, null, 2),
        "final enriched order"
      );

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
        order_status: ORDER_STATUS.PLACED,
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

        // console.log("order items:", payload.items, "order ends");

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

  // order by admin and staff
  async placeOrderAdmin(
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

          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name} is out of stock or does not have enough quantity`
          );
        }

        // lot consumption (FIFO)
        const consumedLots = await this.consumeLotsFIFO(
          item.product,
          item.variant,
          item.quantity,
          session
        );
        item.lots = consumedLots;

        stock.available_quantity -= item.quantity;
        stock.total_sold = (stock.total_sold || 0) + item.quantity;
        item.total_sold = (item.total_sold || 0) + item.quantity;
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
        paid_amount: data.paid_amount || 0,
        discounts: data.discounts || 0,
        invoice_number,
        order_id,
        payment_type: data.payment_type,
        payment_status: PAYMENT_STATUS.PENDING,
        order_at: new Date(),
        order_status: ORDER_STATUS.PLACED,
      };

      if (data?.tax && data?.tax > 0) {
        data.tax = Number(data?.tax.toFixed());
        payload.total_amount += data.tax;
      }

      // console.log(data.delivery_charge, "delivery address");

      // data.delivery_charge = Number(data?.delivery_charge.toFixed());

      // dakha 70TK OUT SIDE DELIVERY CHARGE 120 TK
      if (data?.delivery_charge && data?.delivery_charge > 0) {
        data.delivery_charge = Number(data?.delivery_charge.toFixed());
        payload.total_amount += data.delivery_charge;
        payload.delivery_charge = data.delivery_charge;
        payload.is_delivery_charge_paid = true;
      }

      payload.payment_status = PAYMENT_STATUS.PENDING;
      payload.payable_amount = payload.total_amount;
      if (data?.discounts && data?.discounts > 0) {
        data.discounts = Number(data?.discounts.toFixed());
        payload.payable_amount -= data.discounts;
      }
      if (data?.paid_amount && data?.paid_amount > 0) {
        data.paid_amount = Number(data?.paid_amount.toFixed());
        payload.payable_amount -= data.paid_amount;
      }

      payload.order_status = ORDER_STATUS.PLACED;

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

  // exchange and return order
  async placeExchangeOrReturnOrder(
    data: IOrderPlace
  ): Promise<{ order: IOrder[]; payment_url: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();
    // console.log("exchanges data");
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

          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name} is out of stock or does not have enough quantity`
          );
        }

        // lot consumption (FIFO)
        const consumedLots = await this.consumeLotsFIFO(
          item.product,
          item.variant,
          item.quantity,
          session
        );
        item.lots = consumedLots;

        stock.available_quantity -= item.quantity;
        stock.total_sold = (stock.total_sold || 0) + item.quantity;
        item.total_sold = (item.total_sold || 0) + item.quantity;
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

      const prevOrder = await OrderModel.findById(
        data.previous_order as string | Types.ObjectId
      );
      if (!prevOrder) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Previous order not found for exchange/return"
        );
      }

      const payload: IOrder = {
        customer_name: prevOrder.customer_name,
        customer_number: prevOrder.customer_number,
        customer_secondary_number: prevOrder.customer_secondary_number,
        customer_email: prevOrder.customer_email,
        orders_by: order_by,

        items,
        total_items,
        total_price,
        total_amount: total_price,
        payable_amount: 0,
        new_cod: data.new_cod || 0,
        delivery_address: prevOrder.delivery_address,
        paid_amount: data.paid_amount || 0,
        discounts: data.discounts || 0,
        invoice_number,
        order_id,
        order_type: "exchange",
        payment_type: data.payment_type,
        payment_status: PAYMENT_STATUS.PAID,
        order_at: new Date(),
        order_status: ORDER_STATUS.EXCHANGE_REQUESTED,

        previous_order: prevOrder._id,
      };

      if (data?.tax && data?.tax > 0) {
        data.tax = Number(data?.tax.toFixed());
        payload.total_amount += data.tax;
      }

      // console.log(data.delivery_charge, "delivery address");

      // data.delivery_charge = Number(data?.delivery_charge.toFixed());

      // dakha 70TK OUT SIDE DELIVERY CHARGE 120 TK
      if (data?.delivery_charge && data?.delivery_charge > 0) {
        data.delivery_charge = Number(data?.delivery_charge.toFixed());
        payload.total_amount += data.delivery_charge;
        payload.delivery_charge = data.delivery_charge;
        payload.is_delivery_charge_paid = true;
      }

      console.log(payload, "data payload");

      payload.payment_status = PAYMENT_STATUS.PAID;
      payload.payable_amount = payload.new_cod || 0;
      if (data?.discounts && data?.discounts > 0) {
        data.discounts = Number(data?.discounts.toFixed());
        payload.payable_amount -= data.discounts;
      }
      if (data?.paid_amount && data?.paid_amount > 0) {
        data.paid_amount = Number(data?.paid_amount.toFixed());
        payload.payable_amount -= data.paid_amount;
      }

      payload.order_status = ORDER_STATUS.EXCHANGE_REQUESTED;

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
  async editOrder(orderId: string, payload: Partial<IOrder>) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ১. পুরাতন অর্ডার আনা
      const order = await OrderModel.findById(orderId).session(session);
      if (!order) {
        throw new ApiError(404, `Order with ID ${orderId} does not exist`);
      }

      // ২. নতুন enriched products (validate & enrich)
      const enrichedOrder = await this.enrichProducts(payload);

      if (!enrichedOrder?.products || enrichedOrder.products.length <= 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Order cannot be empty after edit"
        );
      }

      // ৩. পুরাতন order.items এর stock rollback + total_sold কমানো
      for (const prevItem of order.items ?? []) {
        const stock = await StockModel.findOne({
          product: prevItem.product,
          variant: prevItem.variant,
        }).session(session);

        if (stock) {
          // স্টকে quantity ফেরত দিন
          await StockModel.findByIdAndUpdate(
            stock._id,
            { $inc: { available_quantity: prevItem.quantity } },
            { session }
          );
          // total_sold কমান
          stock.total_sold = (stock.total_sold || 0) - prevItem.quantity;
          if (stock.total_sold < 0) stock.total_sold = 0; // নেগেটিভ হলে ০
          await stock.save({ session });
        }
      }

      // ৪. নতুন/পরিবর্তিত আইটেমের জন্য stock allocate + total_sold বাড়ানো
      let total_price = 0;
      for (const item of enrichedOrder.products) {
        const stock = await StockModel.findOne(
          { product: item.product, variant: item.variant },
          null,
          { session }
        );
        if (!stock || stock.available_quantity < item.quantity) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name ?? item.product} is out of stock`
          );
        }

        // FIFO lots থেকে কাটছে, lots ডিটেইল সেট হচ্ছে
        const consumedLots = await this.consumeLotsFIFO(
          item.product,
          item.variant,
          item.quantity,
          session
        );

        item.lots = consumedLots;
        item.subtotal = item.price * item.quantity;
        total_price += item.subtotal;

        // স্টক কমাও
        stock.available_quantity -= item.quantity;
        // total_sold বাড়াও
        stock.total_sold = (stock.total_sold || 0) + item.quantity;
        await stock.save({ session });
      }

      // ৫. order ফিল্ড আপডেট
      order.items = enrichedOrder.products;
      order.total_items = enrichedOrder.products.length;
      order.total_price = total_price;
      order.total_amount = total_price;
      order.payable_amount = total_price;

      // ৬. সাধারণ ফিল্ড আপডেট
      if (payload.customer_name) order.customer_name = payload.customer_name;
      if (payload.customer_number)
        order.customer_number = payload.customer_number;
      if (payload.customer_secondary_number)
        order.customer_secondary_number = payload.customer_secondary_number;
      if (payload.customer_email) order.customer_email = payload.customer_email;
      if (payload.delivery_address)
        order.delivery_address = payload.delivery_address;
      if (payload.payment_type) order.payment_type = payload.payment_type;
      if (payload.orders_by) order.orders_by = payload.orders_by;
      if (payload.paid_amount) order.paid_amount = payload.paid_amount;
      if (payload.delivery_charge) {
        order.delivery_charge = payload.delivery_charge;
        order.total_amount +=
          payload.delivery_charge || order.delivery_charge || 0;
      }
      if (payload.discounts) order.discounts = payload.discounts;

      await order.save({ session });

      // ৭. cart ক্লিয়ার (যদি থাকে)
      await CartService.clearCartAfterCheckout(
        order.user as Types.ObjectId,
        session
      );

      await session.commitTransaction();
      session.endSession();

      // ৮. populate করে অর্ডার ফেরত দিন
      const populatedOrder = await OrderModel.findById(order._id)
        .populate({
          path: "items.product",
          select: "name slug sku thumbnail description",
        })
        .populate({
          path: "items.variant",
          select:
            "attributes attribute_values regular_price sale_price sku barcode image",
        });

      return { order: populatedOrder, payment_url: "" };
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
    const orderArr = await OrderModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },

      // Populate previous_order (only one level, light fields)
      {
        $lookup: {
          from: "orders",
          localField: "previous_order",
          foreignField: "_id",
          as: "previousOrderData",
        },
      },
      {
        $unwind: {
          path: "$previousOrder",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Populate previous_variant from previousOrderData.items.previous_variant
      // {
      //   $lookup: {
      //     from: "variants",
      //     let: { previousVariants: "$previousOrderData.items.previous_variant" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: { $in: ["$_id", { $ifNull: ["$$previousVariants", []] }] },
      //         },
      //       },
      //     ],
      //     as: "previousVariantsData",
      //   },
      // },

      // Attach only select fields from previous_order & previous_variant
      {
        $addFields: {
          previous_order: {
            $cond: [
              { $ifNull: ["$previousOrderData._id", false] },
              {
                _id: "$previousOrderData._id",
                order_id: "$previousOrderData.order_id",
                invoice_number: "$previousOrderData.invoice_number",
                total_items: "$previousOrderData.total_items",
                total_price: "$previousOrderData.total_price",
                payable_amount: "$previousOrderData.payable_amount",
                order_status: "$previousOrderData.order_status",
                order_at: "$previousOrderData.order_at",
                // Attach previous_variant array
                previous_variant: "$previousVariantsData",
              },
              null,
            ],
          },
        },
      },

      // Populate product, variant, courier, logs for main order
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productsData",
        },
      },
      {
        $lookup: {
          from: "variants",
          localField: "items.variant",
          foreignField: "_id",
          as: "variantsData",
        },
      },
      {
        $lookup: {
          from: "couriers",
          localField: "courier",
          foreignField: "_id",
          as: "courierData",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "logs.user",
          foreignField: "_id",
          as: "logUsers",
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: { $sortArray: { input: "$items", sortBy: { _id: 1 } } },
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
                    previous_variant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$variantsData",
                            as: "pv",
                            cond: {
                              $eq: ["$$pv._id", "$$item.previous_variant"],
                            },
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
          courier: { $arrayElemAt: ["$courierData", 0] },
          logs: {
            $map: {
              input: { $sortArray: { input: "$logs", sortBy: { time: -1 } } },
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

    const order = orderArr[0];
    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${id}`
      );
    }

    return order as IOrder;
  }

  async getOrders(query: OrderQuery): Promise<{
    meta: { page: number; limit: number; total: number };
    status_count: Istatus_count & { all: number };
    data: IOrder[];
  }> {
    const {
      page = "1",
      limit = "100",
      start_date,
      end_date,
      status,
      phone,
      parcel_id,
      sku,
      order_id,
      orders_by,
    } = query;

    const pipeline: any[] = [];
    const matchStage: any = {};

    // Date filter
    if (start_date || end_date) {
      matchStage.order_at = {};
      if (start_date) {
        matchStage.order_at.$gte = new Date(start_date);
      }
      if (end_date) {
        matchStage.order_at.$lte = new Date(end_date);
      }
    }

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        matchStage.order_status = { $in: status };
      } else if (typeof status === "string" && status.includes(",")) {
        matchStage.order_status = {
          $in: status.split(",").map((s) => s.trim()),
        };
      } else {
        matchStage.order_status = status;
      }
    }

    // Partial phone filter
    if (phone) {
      matchStage["customer_number"] = { $regex: phone, $options: "i" };
    }

    // SKU filter - will apply after $addFields
    if (sku) {
      matchStage["_skuFilter"] = { $regex: sku, $options: "i" };
    }

    // Order ID filter
    if (order_id) {
      if (!isNaN(Number(order_id))) {
        matchStage.order_id = Number(order_id);
      } else {
        matchStage.order_id = order_id;
      }
    }

    // Initial $match for all filters except SKU & parcel_id
    const preMatchStage = { ...matchStage };
    if (preMatchStage["_skuFilter"]) delete preMatchStage["_skuFilter"];
    if (Object.keys(preMatchStage).length) {
      pipeline.push({ $match: preMatchStage });
    }

    // Sorting
    if (orders_by) {
      const [field, direction = "desc"] = orders_by.split(":");
      pipeline.push({ $sort: { [field]: direction === "asc" ? 1 : -1 } });
    } else {
      pipeline.push({ $sort: { order_at: -1 } });
    }

    // Populate product, variant, courier, user
    pipeline.push({
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productsDocs",
      },
    });
    pipeline.push({
      $lookup: {
        from: "variants",
        localField: "items.variant",
        foreignField: "_id",
        as: "variantsDocs",
      },
    });
    pipeline.push({
      $lookup: {
        from: "couriers",
        localField: "courier",
        foreignField: "_id",
        as: "courierDocs",
      },
    });
    pipeline.push({
      $unwind: {
        path: "$courierDocs",
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push(
      // 1. make sure we have an array of added_by ids (empty if admin_notes absent)
      {
        $addFields: {
          _admin_note_userIds: {
            $map: {
              input: { $ifNull: ["$admin_notes", []] },
              as: "n",
              in: "$$n.added_by",
            },
          },
        },
      },
      // 2. lookup all users whose _id is in that list
      {
        $lookup: {
          from: "users", // adjust collection name if needed
          localField: "_admin_note_userIds",
          foreignField: "_id",
          as: "_admin_note_users",
        },
      },
      // 3. replace each admin_notes element's added_by with the full user doc (or keep null if not found)
      {
        $addFields: {
          admin_notes: {
            $map: {
              input: { $ifNull: ["$admin_notes", []] },
              as: "n",
              in: {
                $mergeObjects: [
                  "$$n",
                  {
                    added_by: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$_admin_note_users",
                            as: "u",
                            cond: {
                              $eq: [
                                "$$u._id",
                                { $toObjectId: "$$n.added_by" }, // এখানে fix করা হয়েছে
                              ],
                            },
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
      // 4. cleanup temp arrays
      {
        $project: {
          _admin_note_userIds: 0,
          _admin_note_users: 0,
        },
      }
    );

    // === Parcel ID filter on courierDocs.consignment_id ===
    if (parcel_id) {
      pipeline.push({
        $match: {
          "courierDocs.consignment_id": { $regex: parcel_id, $options: "i" },
        },
      });
    }

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

    // Inject product/variant objects into items array
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
        courier: "$courierDocs",
      },
    });

    pipeline.push({
      $project: {
        productsDocs: 0,
        variantsDocs: 0,
        userDocs: 0,
        courierDocs: 0,
      },
    });

    // SKU filter applied after $addFields (on populated items[].variant.sku)
    if (sku) {
      pipeline.push({
        $match: {
          "items.variant.sku": matchStage["_skuFilter"],
        },
      });
    }

    // Pagination
    const _page = Math.max(Number(page), 1);
    const _limit = Math.max(Number(limit), 1);
    pipeline.push({ $skip: (_page - 1) * _limit });
    pipeline.push({ $limit: _limit });

    // ---- Fetch filtered data ----
    const orders = await OrderModel.aggregate(pipeline);

    // For total, run same preMatchStage filter (without SKU/parcel_id),
    // then filter items.variant.sku in JS (because pipeline count with $addFields is tough)
    let total = await OrderModel.countDocuments(preMatchStage);

    if (sku || parcel_id) {
      // When SKU or parcel_id filter, count only those matching after $addFields
      const countPipeline = [...pipeline];
      countPipeline.splice(countPipeline.length - 2, 2); // remove skip/limit
      countPipeline.push({
        $count: "total",
      });
      const countRes = await OrderModel.aggregate(countPipeline);
      total = countRes[0]?.total || 0;
    }

    // ---- Status Aggregation (Full DB, no filter!) ----
    const statusCountsAgg = await OrderModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$order_status", "unknown"] },
          count: { $sum: 1 },
        },
      },
    ]);

    const orderStatusList: IOrderStatus[] = [
      "failed",
      "pending",
      "placed",
      "accepted",
      "rts",
      "handed_over_to_courier",
      "in_transit",
      "delivered",
      "pending_return",
      "returned",
      "cancelled",
      "exchange_requested",
      "exchanged",
      "incomplete",
      "partial",
      "unknown",
      "lost",
    ];

    // Build status_count object at root level + all property
    const status_count: Istatus_count & { all: number } =
      {} as Istatus_count & { all: number };
    orderStatusList.forEach((status) => {
      status_count[status] = 0;
    });
    statusCountsAgg.forEach((row) => {
      const key =
        typeof row._id === "string" ? row._id.trim() : String(row._id);
      if (orderStatusList.includes(key as IOrderStatus)) {
        status_count[key as IOrderStatus] = row.count;
      }
    });

    // Calculate sum of all statuses
    status_count.all = orderStatusList.reduce(
      (sum, s) => sum + (status_count[s] || 0),
      0
    );

    return {
      meta: { page: _page, limit: _limit, total },
      status_count,
      data: orders,
    };
  }

  // delete order by id
  async deleteOrder(id: string): Promise<void> {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${id}`
      );
    }
    if (
      order.order_status !== ORDER_STATUS.CANCELLED &&
      order.order_status !== ORDER_STATUS.FAILED
    ) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Only cancelled and failed orders can be deleted`
      );
    }
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
    const session = await OrderModel.startSession();
    session.startTransaction();
    try {
      const order = await OrderModel.findById(order_id).session(session);
      if (!order) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          `Order was not found with id: ${order_id}`
        );
      }

      const previousStatus = order.order_status || "N/A";

      if (
        order.order_status === ORDER_STATUS.HANDED_OVER_TO_COURIER &&
        [ORDER_STATUS.RTS, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PLACED].includes(
          status
        )
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          `Cannot change status from handed_over_to_courier to ${status}`
        );
      }

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
        { new: true, session }
      );

      if (!updatedOrder) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          `Order was not found with id: ${order_id}`
        );
      }

      if (
        status === ORDER_STATUS.CANCELLED ||
        status === ORDER_STATUS.RETURNED ||
        status === ORDER_STATUS.FAILED
      ) {
        // restore stock if order is cancelled
        for (const item of updatedOrder.items ?? []) {
          const stock = await StockModel.findOne(
            {
              product: item.product,
              variant: item.variant,
            },
            null,
            { session }
          );

          if (stock) {
            stock.available_quantity += item.quantity;
            await stock.save({ session });
          }

          // restore lots
          for (const lotUsage of item.lots) {
            const lot = await LotModel.findById(lotUsage.lotId).session(
              session
            );
            if (!lot) {
              throw new ApiError(
                HttpStatusCode.NOT_FOUND,
                `Lot not found with id: ${lotUsage.lotId}`
              );
            }
            if (lot) {
              lot.qty_available += lotUsage.deducted;
              await lot.save({ session });
            }
          }
        }
      }

      await session.commitTransaction();
      return updatedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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

  async addAdminNoteToOrder(orderId: string, note: string, userId: string) {
    console.log(orderId, "user id and data");
    try {
      const order = await OrderModel.findById(orderId);
      if (!order) {
        throw new ApiError(404, "Order not found for notes");
      }
      order.admin_notes = order.admin_notes || [];
      order.admin_notes.push({
        note,
        added_by: new Types.ObjectId(userId),
        added_at: new Date(),
      });
      await order.save();
      return order;
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || 500,
        error?.message || "Error adding admin note to order"
      );
    }
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
    const gazipurDistricts = ["gazipur", "গাজীপুর", "গাজিপুর", "Gazipur"];
    const dhakaDistricts = ["dhaka", "ঢাকা", "Dhaka"];

    const div = division.toLowerCase().trim();
    const dist = district.toLowerCase().trim();

    const isDhakaDivision = dhakaDivisions.some((d) => d.toLowerCase() === div);
    const isGazipurDistrict = gazipurDistricts.some(
      (d) => d.toLowerCase() === dist
    );

    const isDhakaDistrict = dhakaDistricts.some(
      (d) => d.toLowerCase() === dist
    );

    if (isDhakaDivision && isGazipurDistrict) return 70;
    if (isDhakaDivision && isDhakaDistrict) return 100;
    return 150;
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
          previous_variant: cartItem.previous_variant,
          quantity: cartItem.quantity,
          lots: cartItem.lots,
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

  private async consumeLotsFIFO(
    productId: string,
    variantId: string,
    requiredQty: number,
    session?: any
  ): Promise<{ lotId: string; deducted: number }[]> {
    const lots = await LotModel.find(
      {
        product: productId,
        variant: variantId,
        qty_total: { $gt: 0 },
      },
      null,
      { session }
    ).sort({ createdAt: 1 }); // FIFO

    // console.log(lots, "lots data")

    let remaining = requiredQty;
    const consumption: { lotId: string; deducted: number }[] = [];

    for (const lot of lots) {
      if (remaining <= 0) break;

      let deductFromThisLot = 0;
      if (lot.qty_available <= remaining) {
        deductFromThisLot = lot.qty_available;
        remaining -= lot.qty_available;
        lot.qty_available = 0;
      } else {
        deductFromThisLot = remaining;
        lot.qty_available -= remaining;
        remaining = 0;
      }
      await lot.save({ session });

      consumption.push({
        lotId: lot._id.toString(),
        deducted: deductFromThisLot,
      });
    }

    if (remaining > 0) {
      throw new Error("Insufficient lots stock!");
    }

    // Return consumption details
    return consumption;
  }
}

export const OrderService = new Service();
