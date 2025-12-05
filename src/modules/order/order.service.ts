import mongoose, { Types } from "mongoose";
import { CartService } from "../cart/cart.service";
import {
  IOrder,
  IOrderBy,
  IOrderItem,
  IOrderPlace,
  IOrderStatus,
  Istatus_count,
  ReportParams,
} from "./order.interface";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ICartItem } from "../cart/cart.interface";
import { InvoiceService } from "@/lib/invoice";
import { CounterModel } from "@/common/models/counter.model";
import { OrderModel } from "./order.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { BkashService } from "../bkash/bkash.service";
import {
  ORDER_STATUS,
  ORDER_STATUSES_REPORT,
  PAYMENT_STATUS,
} from "./order.enums";
import { ProductModel } from "../product/product.model";
import { OrderQuery } from "@/interfaces/common.interface";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { StockModel } from "../stock/stock.model";
import { VariantModel } from "../variant/variant.model";
import { UserModel } from "../user/user.model";
import { LotModel } from "../lot/lot.model";
import pLimit from "p-limit";
import { GlobalStockModel } from "../stock/globalStock.model";

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

      let total_stock_issue = false;

      // check stock availability [most important]
      for (const item of enrichedOrder.products) {
        // console.log(item.variant, "for stock");
        const stock = await GlobalStockModel.findOne(
          {
            product: item.product,
            variant: item.variant,
          },
          null,
          { session }
        );

        if (!stock) {
          // await session.abortTransaction();
          // throw new ApiError(
          //   HttpStatusCode.BAD_REQUEST,
          //   `Product ${item.product.name} is out of stock or does not have enough quantity for this order`
          // );

          total_stock_issue = true;
          item.status = ORDER_STATUS.AWAITING_STOCK;
          continue;
        }

        // console.log(stock.available_quantity, "available qnt");
        // console.log(item.quantity, "item qnt");

        if (
          Math.abs(stock.qty_reserved - stock.available_quantity) <
          item.quantity
        ) {
          total_stock_issue = true;
          item.status = ORDER_STATUS.AWAITING_STOCK;
          continue;
        } else {
          // lot consumption (FIFO)
          const consumedLots = await this.simulateConsumeLotsFIFO(
            item.product,
            item.variant,
            item.quantity,
            session
          );

          item.lots = consumedLots;
          // console.log(consumedLots, "consumed lots `");

          stock.qty_reserved += item.quantity;
          stock.total_sold = (stock.total_sold || 0) + item.quantity;
          item.total_sold = (item.total_sold || 0) + item.quantity;
          await stock.save({ session });
        }
      }

      // console.log(
      //   JSON.stringify(enrichedOrder.products, null, 2),
      //   "final enriched order"
      // );

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
        is_assigned_product_scan: false,
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
        order_status: total_stock_issue
          ? ORDER_STATUS.AWAITING_STOCK
          : ORDER_STATUS.PLACED,
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
        payload.order_status = total_stock_issue
          ? ORDER_STATUS.AWAITING_STOCK
          : ORDER_STATUS.PLACED;
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

      let total_stock_issue = false;

      // console.log(cartItems, "cart items");

      // check stock availability [most important]
      for (const item of enrichedOrder.products) {
        // console.log(item.variant, "for stock");
        const stock = await GlobalStockModel.findOne(
          {
            product: item.product,
            variant: item.variant,
          },
          null,
          { session }
        );

        // console.log(stock, "stocks data");

        if (!stock) {
          // await session.abortTransaction();
          // session.endSession();
          // throw new ApiError(
          //   HttpStatusCode.BAD_REQUEST,
          //   `Product ${item.product.name} is out of stock or does not have enough quantity`
          // );
          total_stock_issue = true;
          item.status = ORDER_STATUS.AWAITING_STOCK;
          continue;
        }

        // console.log(stock.available_quantity, "available qnt");
        // console.log(item.quantity, "item qnt");

        if (
          Math.abs(stock.qty_reserved - stock.available_quantity) <
          item.quantity
        ) {
          total_stock_issue = true;
          item.status = ORDER_STATUS.AWAITING_STOCK;
          continue;
        } else {
          // lot consumption (FIFO)
          const consumedLots = await this.simulateConsumeLotsFIFO(
            item.product,
            item.variant,
            item.quantity,
            session
          );
          item.lots = consumedLots;
          // console.log(consumedLots, "consumed lots `");

          stock.qty_reserved += item.quantity;
          stock.total_sold = (stock.total_sold || 0) + item.quantity;
          item.total_sold = (item.total_sold || 0) + item.quantity;
          await stock.save({ session });
        }
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

      // console.log(data.user_id, "admin placing order for user");

      const payload: IOrder = {
        user: data.user_id as Types.ObjectId,
        customer_name: data.customer_name,
        customer_number: data.customer_number,
        customer_secondary_number: data.customer_secondary_number,
        customer_email: data.customer_email,
        orders_by: order_by,
        is_assigned_product_scan: false,

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
        order_status: total_stock_issue
          ? ORDER_STATUS.AWAITING_STOCK
          : ORDER_STATUS.PLACED,
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

      payload.order_status = total_stock_issue
        ? ORDER_STATUS.AWAITING_STOCK
        : ORDER_STATUS.PLACED;

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

        const stock = await GlobalStockModel.findOne(
          {
            product: item.product,
            variant: item.variant,
          },
          null,
          { session }
        );

        if (
          !stock ||
          Math.abs(stock.qty_reserved - stock.available_quantity) <
            item.quantity
        ) {
          // await session.abortTransaction();

          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name} is out of stock or does not have enough quantity`
          );
        }

        // lot consumption (FIFO)
        const consumedLots = await this.simulateConsumeLotsFIFO(
          item.product,
          item.variant,
          item.quantity,
          session
        );
        item.lots = consumedLots;

        stock.qty_reserved += item.quantity;
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
        is_assigned_product_scan: false,

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

      if (
        order.order_status === ORDER_STATUS.CANCELLED ||
        order.order_status === ORDER_STATUS.RETURNED ||
        order.order_status === ORDER_STATUS.LOST ||
        order.order_status === ORDER_STATUS.UNKNOWN ||
        order.order_status === ORDER_STATUS.RTS ||
        order.order_status === ORDER_STATUS.DELIVERED ||
        order.order_status === ORDER_STATUS.HANDED_OVER_TO_COURIER ||
        order.order_status === ORDER_STATUS.PENDING_RETURN ||
        order.order_status === ORDER_STATUS.EXCHANGED ||
        order.order_status === ORDER_STATUS.PARTIAL ||
        order.order_status === ORDER_STATUS.FAILED
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          `Cannot edit ${order.order_status} order`
        );
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
        // if (prevItem.status === ORDER_STATUS.AWAITING_STOCK) {
        //   continue;
        // }

        const stock = await GlobalStockModel.findOne({
          product: prevItem.product,
          variant: prevItem.variant,
        }).session(session);

        // const lots = await LotModel.findOne({
        //   variant: prevItem.variant,
        // }).session(session);

        // if (lots) {
        //   // পূর্বে কাটাকাটা lot গুলো ফিরিয়ে দিন
        //   lots.qty_reserved -= prevItem.quantity;
        //   await lots.save({ session });
        // }

        if (stock) {
          // স্টকে quantity ফেরত দিন
          await GlobalStockModel.findOneAndUpdate(
            { product: stock.product, variant: stock.variant },
            { $inc: { qty_reserved: -prevItem.quantity } },
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
        const stock = await GlobalStockModel.findOne(
          { product: item.product, variant: item.variant },
          null,
          { session }
        );
        if (
          !stock ||
          Math.abs(stock.qty_reserved - stock.available_quantity) <
            item.quantity
        ) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${item.product.name ?? item.product} is out of stock`
          );
        }

        // FIFO lots থেকে কাটছে, lots ডিটেইল সেট হচ্ছে
        const consumedLots = await this.simulateConsumeLotsFIFO(
          item.product,
          item.variant,
          item.quantity,
          session
        );

        item.lots = consumedLots;
        item.subtotal = item.price * item.quantity;
        total_price += item.subtotal;

        // স্টক কমাও
        stock.qty_reserved += item.quantity;
        // total_sold বাড়াও
        stock.total_sold = (stock.total_sold || 0) + item.quantity;
        await stock.save({ session });
      }

      // ৫. আইটেমস, টোটাল প্রাইস আপডেট (items first, then amounts)
      order.items = enrichedOrder.products;
      order.total_items = enrichedOrder.products.length;
      order.total_price = total_price;

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
      if (payload.discounts) order.discounts = payload.discounts;

      // Numeric fields: use !== undefined so 0 is accepted from payload
      if (payload.paid_amount !== undefined) {
        order.paid_amount = Number(payload.paid_amount);
      }
      if (payload.delivery_charge !== undefined) {
        // if payload provides delivery_charge (even 0), use it
        order.delivery_charge = Number(payload.delivery_charge);
      } else {
        // if payload doesn't provide delivery_charge, keep existing (or default to 0)
        order.delivery_charge = order.delivery_charge ?? 0;
      }

      // Now compute totals with delivery_charge included
      order.total_amount =
        Number(order.total_price ?? 0) + Number(order.delivery_charge ?? 0);

      // payable_amount typically = total_amount - paid_amount (adjust as per your business logic)
      order.payable_amount =
        Number(order.total_amount) - Number(order.paid_amount ?? 0);
      if (order.payable_amount < 0) order.payable_amount = 0;

      // save within session
      await order.save({ session });

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

  async loginUserOrder(
    userId?: string,
    phone_number?: string
  ): Promise<IOrder[] | null> {
    try {
      // build $or conditions only for provided values
      const orConditions: Record<string, any>[] = [];

      if (userId) {
        // guard: only push valid ObjectId
        try {
          orConditions.push({ user: new Types.ObjectId(userId) });
        } catch (e) {
          // invalid object id string -> ignore user condition (or you may choose to throw)
        }
      }

      if (phone_number) {
        orConditions.push({ customer_number: phone_number });
      }

      if (orConditions.length === 0) {
        // nothing to search for
        return null;
      }

      // find the most recent order matching either condition
      const order = await OrderModel.find({ $or: orConditions })
        .sort({ order_at: -1 })
        // populate item product & variant (adjust selects as needed)
        .populate({
          path: "items.product",
          select: "name slug sku thumbnail description price", // change fields as needed
        })
        .populate({
          path: "items.variant",
          select:
            "attributes attribute_values regular_price sale_price sku barcode image",
        })
        // populate order owner
        .populate({ path: "user", select: "name email phone" })
        // populate admin_notes.added_by if you have admin_notes subdocs
        .populate({ path: "admin_notes.added_by", select: "name email role" })
        // populate courier (if present)
        .populate({ path: "courier", select: "name phone tracking_url" })
        .exec();

      return order as IOrder[];
    } catch (error) {
      // log error if you want: console.error(error);
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to retrieve order"
      );
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
      // --- User or Admin dynamic populate ---
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userFromUsers",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "user",
          foreignField: "_id",
          as: "userFromAdmins",
        },
      },
      {
        $addFields: {
          order_by: {
            $cond: {
              if: { $eq: ["$user_or_admin_model", "User"] },
              then: "$userFromUsers",
              else: "$userFromAdmins",
            },
          },
        },
      },
      {
        $project: {
          userFromUsers: 0,
          userFromAdmins: 0,
        },
      },

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

      // --- Admin Notes Populate ---
      {
        $addFields: {
          _admin_note_userIds: {
            $map: {
              input: { $ifNull: ["$admin_notes", []] },
              as: "note",
              in: "$$note.added_by",
            },
          },
        },
      },
      {
        $lookup: {
          from: "admins",
          let: { adminUserIds: "$_admin_note_userIds" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", { $ifNull: ["$$adminUserIds", []] }] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                phone_number: 1,
                role: 1,
              },
            },
          ],
          as: "_admin_note_users",
        },
      },
      {
        $addFields: {
          admin_notes: {
            $map: {
              input: { $ifNull: ["$admin_notes", []] },
              as: "note",
              in: {
                $mergeObjects: [
                  "$$note",
                  {
                    added_by: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$_admin_note_users",
                            as: "u",
                            cond: { $eq: ["$$u._id", "$$note.added_by"] },
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
      {
        $project: {
          _admin_note_userIds: 0,
          _admin_note_users: 0,
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
      pipeline.push({ $sort: { updatedAt: -1 } });
    }

    pipeline.push(
      // 1) normalize user to ObjectId if it's a string
      {
        $addFields: {
          _user_objid_temp: {
            $cond: [
              {
                $and: [
                  { $ne: ["$user", null] },
                  { $eq: [{ $type: "$user" }, "string"] },
                ],
              },
              { $toObjectId: "$user" },
              "$user",
            ],
          },
        },
      },

      // 2) lookup from users with projection
      {
        $lookup: {
          from: "users",
          let: { userId: "$_user_objid_temp" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
            {
              $project: { _id: 1, name: 1, phone_number: 1, role: 1, email: 1 },
            },
          ],
          as: "userData",
        },
      },

      // 3) lookup from admins with projection
      {
        $lookup: {
          from: "admins",
          let: { userId: "$_user_objid_temp" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
            {
              $project: { _id: 1, name: 1, phone_number: 1, role: 1, email: 1 },
            },
          ],
          as: "adminData",
        },
      },

      // 4) choose based on user_or_admin_model; if missing, fallback to whichever exists; if none exists -> null
      {
        $addFields: {
          create_order_by: {
            $let: {
              vars: {
                u: { $arrayElemAt: ["$userData", 0] },
                a: { $arrayElemAt: ["$adminData", 0] },
              },
              in: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$user_or_admin_model", "User"] },
                      then: "$$u",
                    },
                    {
                      case: { $eq: ["$user_or_admin_model", "Admin"] },
                      then: "$$a",
                    },
                  ],
                  default: {
                    $cond: [
                      { $ifNull: ["$$u", false] },
                      "$$u",
                      { $cond: [{ $ifNull: ["$$a", false] }, "$$a", null] },
                    ],
                  },
                },
              },
            },
          },
        },
      },

      // 5) optional: keep only safe fields inside create_order_by (avoid leaking sensitive info)
      {
        $addFields: {
          create_order_by: {
            $cond: [
              { $ifNull: ["$create_order_by", false] },
              {
                _id: "$create_order_by._id",
                name: "$create_order_by.name",
                phone_number: "$create_order_by.phone_number",
                email: "$create_order_by.email",
                role: "$create_order_by.role",
              },
              null,
            ],
          },
        },
      },

      // 6) cleanup temps
      {
        $project: {
          userData: 0,
          adminData: 0,
          _user_objid_temp: 0,
          user_or_admin_model: 0,
        },
      }
    );

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
      // 1️⃣ collect all added_by ids from admin_notes
      {
        $addFields: {
          _admin_note_userIds: {
            $map: {
              input: { $ifNull: ["$admin_notes", []] },
              as: "n",
              in: { $toObjectId: "$$n.added_by" },
            },
          },
        },
      },
      // 2️⃣ lookup Admin collection (ref: "Admin" → collection name: "admins")
      {
        $lookup: {
          from: "admins",
          localField: "_admin_note_userIds",
          foreignField: "_id",
          as: "_admin_note_users",
        },
      },
      // 3️⃣ replace each admin_notes.added_by with matched user doc
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
                      $let: {
                        vars: {
                          matched: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$_admin_note_users",
                                  as: "u",
                                  cond: {
                                    $eq: [
                                      "$$u._id",
                                      { $toObjectId: "$$n.added_by" },
                                    ],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          _id: "$$matched._id",
                          name: "$$matched.name",
                          phone_number: "$$matched.phone_number",
                          role: "$$matched.role",
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      // 4️⃣ remove temporary fields
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
      "awaiting_stock",
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

  // report day update
  async generateOrderReport(params: ReportParams = {}) {
    const { start_date, end_date, user } = params;
    const match: any = {};

    // sanitize and apply date filters
    if (start_date) {
      const sd = new Date(start_date);
      if (!isNaN(sd.getTime())) match.order_at = { $gte: sd };
    }
    if (end_date) {
      const ed = new Date(end_date);
      if (!isNaN(ed.getTime())) {
        ed.setHours(23, 59, 59, 999);
        match.order_at = match.order_at
          ? { ...match.order_at, $lte: ed }
          : { $lte: ed };
      }
    }

    // sanitize user param (allow numbers/objects converted to string)
    if (user !== undefined && user !== null && String(user).trim() !== "") {
      const uid = String(user).trim();
      if (!Types.ObjectId.isValid(uid)) throw new Error("Invalid user id");
      match.user = new Types.ObjectId(uid);
    }

    const pipeline: any[] = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });

    // keep lookups so we can attach Admin/User doc (arrays) for later per-user aggregation
    pipeline.push(
      {
        $lookup: {
          from: "admins",
          localField: "user",
          foreignField: "_id",
          as: "userFromAdmins",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userFromUsers",
        },
      },
      {
        $addFields: {
          // actor is convenient for sample orders if needed (kept minimal)
          actor: {
            $cond: [
              { $eq: ["$user_or_admin_model", "Admin"] },
              { $arrayElemAt: ["$userFromAdmins", 0] },
              { $arrayElemAt: ["$userFromUsers", 0] },
            ],
          },
        },
      }
      // DO NOT $project userFromAdmins/userFromUsers away here because by_order_by_admin uses them
    );

    // Facet: compute totals, byStatus, and per-user aggregated admin-aware breakdown
    pipeline.push({
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total_orders: { $sum: 1 },
              total_amount: { $sum: { $ifNull: ["$total_amount", 0] } },
              total_paid: { $sum: { $ifNull: ["$paid_amount", 0] } },
              avg_order_value: { $avg: { $ifNull: ["$total_amount", 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              total_orders: 1,
              total_amount: 1,
              total_paid: 1,
              avg_order_value: 1,
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: "$order_status",
              count: { $sum: 1 },
              total_amount: { $sum: { $ifNull: ["$total_amount", 0] } },
            },
          },
          { $project: { _id: 0, status: "$_id", count: 1, total_amount: 1 } },
        ],
        // Build per-user aggregation and attach admin actor if exists.
        // This facet returns one entry per distinct user referenced in the matched orders.
        byOrderByAdmin: [
          {
            $group: {
              _id: { user: "$user", status: "$order_status" },
              count: { $sum: 1 },
              total_amount: { $sum: { $ifNull: ["$total_amount", 0] } },
              sample_userFromAdmins: { $first: "$userFromAdmins" },
              sample_userFromUsers: { $first: "$userFromUsers" },
            },
          },
          {
            $group: {
              _id: "$_id.user",
              orders_count: { $sum: "$count" },
              total_amount: { $sum: "$total_amount" },
              statuses: {
                $push: {
                  status: "$_id.status",
                  count: "$count",
                  total_amount: "$total_amount",
                },
              },
              sample_admin_array: { $first: "$sample_userFromAdmins" },
              sample_user_array: { $first: "$sample_userFromUsers" },
            },
          },
          // remove null user ids (user_id: null)
          { $match: { _id: { $ne: null } } },
          {
            // pick first admin/user doc (if any) into fields
            $addFields: {
              actor_from_admin: { $arrayElemAt: ["$sample_admin_array", 0] },
              actor_from_user: { $arrayElemAt: ["$sample_user_array", 0] },
            },
          },
          {
            // project only required actor fields (_id, name, phone_number, role)
            $project: {
              _id: 0,
              user_id: "$_id",
              orders_count: 1,
              total_amount: 1,
              statuses: 1,
              admin_actor: {
                $cond: [
                  {
                    $gt: [
                      { $size: { $ifNull: ["$sample_admin_array", []] } },
                      0,
                    ],
                  },
                  {
                    _id: "$actor_from_admin._id",
                    name: "$actor_from_admin.name",
                    phone_number: "$actor_from_admin.phone_number",
                    role: "$actor_from_admin.role",
                  },
                  "$$REMOVE",
                ],
              },
              user_actor: {
                $cond: [
                  {
                    $gt: [
                      { $size: { $ifNull: ["$sample_user_array", []] } },
                      0,
                    ],
                  },
                  {
                    _id: "$actor_from_user._id",
                    name: "$actor_from_user.name",
                    phone_number: "$actor_from_user.phone_number",
                    role: "$actor_from_user.role",
                  },
                  "$$REMOVE",
                ],
              },
            },
          },
        ],
      },
    });

    const [aggResult] = await OrderModel.aggregate(pipeline).exec();

    // totals (consistent shape)
    const totals = (aggResult?.totals && aggResult.totals[0]) || {
      total_orders: 0,
      total_amount: 0,
      total_paid: 0,
      avg_order_value: 0,
    };

    // by_status array (raw grouped array)
    const by_status = aggResult?.byStatus || [];

    // Build overall status_counts ensuring all known statuses exist
    const status_counts: Record<
      string,
      { count: number; total_amount: number }
    > = {};
    for (const s of ORDER_STATUSES_REPORT)
      status_counts[s] = { count: 0, total_amount: 0 };
    for (const row of by_status) {
      const st = row.status ?? "unknown";
      const cnt = Number(row.count ?? 0);
      const tamt = Number(row.total_amount ?? 0);
      status_counts[st] = { count: cnt, total_amount: tamt };
    }

    // Normalize by_order_by_admin : convert agg docs to desired shape,
    // exclude any null user_id already filtered out in pipeline.
    const rawAdmins = aggResult?.byOrderByAdmin || [];
    const by_order_by_admin: Array<{
      user_id: string;
      actor?: {
        _id: any;
        name?: string;
        phone_number?: string;
        role?: string;
      } | null;
      orders_count: number;
      total_amount: number;
      status_counts: Record<string, { count: number; total_amount: number }>;
    }> = [];

    for (const a of rawAdmins) {
      // init per-user status counts with zeros
      const perUserCounts: Record<
        string,
        { count: number; total_amount: number }
      > = {};
      for (const s of ORDER_STATUSES_REPORT)
        perUserCounts[s] = { count: 0, total_amount: 0 };

      if (Array.isArray(a.statuses)) {
        for (const stRow of a.statuses) {
          const stName = stRow.status ?? "unknown";
          perUserCounts[stName] = {
            count: Number(stRow.count ?? 0),
            total_amount: Number(stRow.total_amount ?? 0),
          };
        }
      }

      // prefer admin_actor if present; otherwise user_actor; otherwise null
      const actor = a.admin_actor ?? a.user_actor ?? null;

      by_order_by_admin.push({
        user_id: String(a.user_id),
        actor: actor ? actor : null,
        orders_count: Number(a.orders_count ?? 0),
        total_amount: Number(a.total_amount ?? 0),
        status_counts: perUserCounts,
      });
    }

    // If user filter is provided, by_order_by_admin will only contain that user's entry (or be empty).
    // totals, status_counts, and by_status are already filtered above by match.

    return {
      totals,
      status_counts,
      by_status,
      by_order_by_admin,
    };
  }

  async updateOrderStatus(
    order_id: string | Types.ObjectId,
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
        previousStatus === ORDER_STATUS.CANCELLED ||
        previousStatus === ORDER_STATUS.RETURNED ||
        previousStatus === ORDER_STATUS.FAILED ||
        previousStatus === ORDER_STATUS.LOST ||
        previousStatus === ORDER_STATUS.EXCHANGED ||
        previousStatus === ORDER_STATUS.INCOMPLETE ||
        previousStatus === ORDER_STATUS.PARTIAL ||
        previousStatus === ORDER_STATUS.AWAITING_STOCK
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          `Cannot change status from ${previousStatus} to ${status}`
        );
      }

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
          if (item.status === ORDER_STATUS.AWAITING_STOCK) {
            continue; // skip stock restore for items that were never in stock
          }

          const stock = await GlobalStockModel.findOne(
            {
              product: item.product,
              variant: item.variant,
            },
            null,
            { session }
          );

          if (stock) {
            stock.qty_reserved -= item.quantity;
            await stock.save({ session });
          }

          // restore lots
          // for (const lotUsage of item.lots) {
          //   const lot = await LotModel.findById(lotUsage.lotId).session(
          //     session
          //   );
          //   if (!lot) {
          //     throw new ApiError(
          //       HttpStatusCode.NOT_FOUND,
          //       `Lot not found with id: ${lotUsage.lotId}`
          //     );
          //   }
          //   if (lot) {
          //     lot.qty_available += lotUsage.deducted;
          //     await lot.save({ session });
          //   }
          // }
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

  async cancleOrder(order_id: string, user_id: string): Promise<IOrder | null> {
    // throw new Error("");

    const order = await OrderModel.findOne({ order_id: order_id });

    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${order_id}`
      );
    }

    if (order.order_status === ORDER_STATUS.CANCELLED) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Order is already cancelled: ${order_id}`
      );
    }

    if (order.order_status !== ORDER_STATUS.AWAITING_STOCK) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Only orders with status AWAITING_STOCK can be cancelled: ${order_id}`
      );
    }

    const previousStatus = order.order_status || "N/A";

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { order_id: order_id },
      {
        $set: { order_status: ORDER_STATUS.CANCELLED },
        $push: {
          logs: {
            user: user_id,
            time: new Date(),
            action: `ORDER_STATUS_UPDATED: ${previousStatus} -> ${ORDER_STATUS.CANCELLED}`,
          },
        },
      },
      { new: true }
    );

    return updatedOrder;
  }

  async updateOrdersStatusBulk(params: {
    ids: string[];
    userId: string;
    status: ORDER_STATUS;
    concurrency?: number;
  }): Promise<{
    updated: { order_id?: number; _id: string; order_status: ORDER_STATUS }[];
    failed: {
      orderId: string;
      error: string;
      order?: { order_id?: number; _id?: string; order_status?: ORDER_STATUS };
    }[];
  }> {
    const { ids, status, userId, concurrency = 10 } = params;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "ids must be a non-empty array for bulk status update"
      );
    }

    const limit = pLimit(concurrency);

    const tasks = ids.map((id) =>
      limit(async () => {
        // Each order gets its own session/transaction
        const session = await OrderModel.startSession();
        session.startTransaction();
        try {
          const order = await OrderModel.findById(id).session(session);
          if (!order) {
            throw new ApiError(
              HttpStatusCode.NOT_FOUND,
              `Order not found: ${id}`
            );
          }

          const previousStatus = order.order_status || "N/A";
          if (
            previousStatus === ORDER_STATUS.CANCELLED ||
            previousStatus === ORDER_STATUS.RETURNED ||
            previousStatus === ORDER_STATUS.FAILED ||
            previousStatus === ORDER_STATUS.LOST ||
            previousStatus === ORDER_STATUS.EXCHANGED ||
            previousStatus === ORDER_STATUS.INCOMPLETE ||
            previousStatus === ORDER_STATUS.PARTIAL ||
            previousStatus === ORDER_STATUS.AWAITING_STOCK
          ) {
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Cannot change status from ${previousStatus} to ${status}`
            );
          }

          if (
            order.order_status === ORDER_STATUS.HANDED_OVER_TO_COURIER &&
            [
              ORDER_STATUS.RTS,
              ORDER_STATUS.ACCEPTED,
              ORDER_STATUS.PLACED,
            ].includes(status)
          ) {
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Cannot change status from handed_over_to_courier to ${status} for order ${id}`
            );
          }

          const updated = await OrderModel.findOneAndUpdate(
            { _id: id },
            {
              $set: { order_status: status },
              $push: {
                logs: {
                  user: userId,
                  time: new Date(),
                  action: `ORDER_STATUS_UPDATED: ${previousStatus} -> ${status}`,
                },
              },
            },
            { new: true, session }
          );

          if (!updated) {
            throw new ApiError(
              HttpStatusCode.NOT_FOUND,
              `Order was not found with id: ${id}`
            );
          }

          // restore stock/lots for cancel/return/failed
          if (
            status === ORDER_STATUS.CANCELLED ||
            status === ORDER_STATUS.RETURNED ||
            status === ORDER_STATUS.FAILED
          ) {
            for (const item of updated.items ?? []) {
              const stock = await GlobalStockModel.findOne(
                { product: item.product, variant: item.variant },
                null,
                { session }
              );
              if (stock) {
                stock.qty_reserved -= item.quantity;
                await stock.save({ session });
              }

              // const lotDoc = await LotModel.findOne(
              //   { variant: item.variant },
              //   null,
              //   { session }
              // );
              // if (lotDoc) {
              //   lotDoc.qty_available += item.quantity;
              //   await lotDoc.save({ session });
              // }
            }
          }

          await session.commitTransaction();
          session.endSession();

          // Return only requested fields for updated
          return {
            orderId: id,
            ok: true,
            order: {
              order_id: (updated as IOrder).order_id,
              _id: String(updated._id),
              order_status: updated.order_status as ORDER_STATUS,
            },
          };
        } catch (err: any) {
          await session.abortTransaction();
          session.endSession();
          const message = err?.message || String(err);

          // Try to fetch minimal order info if exists (outside transaction) to include in failed response
          try {
            const maybeOrder = await OrderModel.findById(id).select({
              order_id: 1,
              order_status: 1,
            });
            if (maybeOrder) {
              return {
                orderId: id,
                ok: false,
                error: message,
                order: {
                  order_id: (maybeOrder as any).order_id,
                  _id: String(maybeOrder._id),
                  order_status: (maybeOrder as any).order_status,
                },
              };
            }
          } catch {
            // ignore fetch errors, will return without order info
          }

          return { orderId: id, ok: false, error: message };
        }
      })
    );

    const results = await Promise.all(tasks);

    const updated: {
      order_id?: number;
      _id: string;
      order_status: ORDER_STATUS;
    }[] = [];
    const failed: {
      orderId: string;
      error: string;
      order?: { order_id?: number; _id?: string; order_status?: ORDER_STATUS };
    }[] = [];

    for (const r of results) {
      if (r.ok)
        updated.push(
          r.order as {
            order_id?: number;
            _id: string;
            order_status: ORDER_STATUS;
          }
        );
      else failed.push({ orderId: r.orderId, error: r.error, order: r.order });
    }

    return { updated, failed };
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

  async setOrderReadyForAccepted(payload: {
    order_id: number | string;
    user?: Types.ObjectId;
  }): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { order_id, user } = payload;
    try {
      const order = await OrderModel.findOne({
        order_id: order_id,
      })
        .session(session)
        .populate("items.product")
        .populate("items.variant");

      if (!order) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          `Order with ID ${payload.order_id} not found`
        );
      }

      if (!order.order_status?.includes(ORDER_STATUS.AWAITING_STOCK)) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          `Cannot set order ${payload.order_id} ready for dispatch status ${order.order_status}`
        );
      }

      for (const item of order.items || []) {
        // console.log(item.variant, "for stock");
        if (String(item.status) !== String(ORDER_STATUS.AWAITING_STOCK)) {
          continue;
        }

        const stock = await GlobalStockModel.findOne(
          {
            product: item.product,
            variant: item.variant,
          },
          null,
          { session }
        );

        if (
          !stock ||
          Math.abs(stock.available_quantity - stock.qty_reserved) <
            item.quantity
        ) {
          // await session.abortTransaction();

          // Guard: item.product may be an ObjectId; fallback to its string form if name is not available
          const productName =
            item.product &&
            typeof item.product === "object" &&
            "name" in item.product
              ? (item.product as any).name
              : String(item.product);
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Product ${productName} is Insufficient stock`
          );
        }

        // lot consumption (FIFO)
        const consumedLots = await this.simulateConsumeLotsFIFO(
          item.product._id ? (item.product as any)._id : item.product,
          item.variant._id ? (item.variant as any)._id : item.variant,
          item.quantity,
          session
        );
        // convert returned lotId strings to ObjectId instances to satisfy the expected type
        item.lots = consumedLots.map((c) => ({
          lotId: new Types.ObjectId(String(c.lotId)),
          deducted: c.deducted,
        })) as any;
        // console.log(consumedLots, "consumed lots `");

        stock.qty_reserved += item.quantity;
        stock.total_sold = (stock.total_sold || 0) + item.quantity;
        item.total_sold = (item.total_sold || 0) + item.quantity;
        item.status = ORDER_STATUS.PLACED;
        await stock.save({ session });
      }

      // update status and log
      order.order_status = ORDER_STATUS.ACCEPTED;
      order.logs = order.logs || [];
      order.logs.push({
        user: user || null,
        time: new Date(),
        action: `ORDER_STATUS_UPDATED: {order.order_status} -> ${ORDER_STATUS.ACCEPTED}`,
      });

      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      // populate before return for consistency with other methods
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

      return populatedOrder as IOrder;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        `Failed to set order ready for dispatch: ${error}`
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
          status: cartItem.status ? cartItem.status : ORDER_STATUS.PLACED,
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

  private async simulateConsumeLotsFIFO(
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
      // await lot.save({ session });

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
