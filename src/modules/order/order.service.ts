import mongoose, { Types } from "mongoose";
import { CartService } from "../cart/cart.service";
import { IOrder, IOrderItem, IOrderPlace } from "./order.interface";
import { ICartItem } from "../cart/cart.interface";
import { InvoiceService } from "@/lib/invoice";
import { CounterModel } from "@/common/models/counter.model";
import { OrderModel } from "./order.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { BkashService } from "../bkash/bkash.service";
import { PAYMENT_STATUS } from "./order.enums";

class Service {
  async placeOrder(data: IOrderPlace): Promise<{ payment_url: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // retrieve user cart
      const cartItems = await CartService.getCartByUser(
        data.user_id as Types.ObjectId
      );
      if (cartItems?.length <= 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Cart is empty, cannot place order"
        );
      }

      // check stock availability [most important]

      // 2. Calculate totals
      const { total_price, items, total_items } = this.calculateCart(cartItems);

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
        delivery_address: data.delivery_address,
        invoice_number,
        order_id,
        payment_method: data.payment_method,
        payment_status: "pending",
        order_at: new Date(),
        status: "pending",
      };

      if (data?.tax && data?.tax > 0) {
        data.tax = Number(data?.tax.toFixed());
        payload.total_amount += data.tax;
      }

      if (data?.discounts && data?.discounts > 0) {
        data.discounts = Number(data?.discounts.toFixed());
        payload.total_amount -= data.discounts;
      }

      if (data?.delivery_charge && data?.delivery_charge > 0) {
        data.delivery_charge = Number(data?.delivery_charge.toFixed());
        payload.total_amount += data.delivery_charge;
        payload.delivery_charge = data.delivery_charge;
      }

      // create payment first
      const { payment_id, payment_url } = await BkashService.createPayment({
        payable_amount: payload.total_amount,
        invoice_number: payload.invoice_number,
      });

      payload.payment_id = payment_id;
      payload.total_amount = Number(payload.total_amount.toFixed());

      // 5. Create order (with session)
      await OrderModel.create([payload], { session });

      // 6. Clear cart (with session)
      await CartService.clearCartAfterCheckout(
        data.user_id as Types.ObjectId,
        session
      );

      // 7. Commit transaction
      await session.commitTransaction();
      session.endSession();
      return { payment_url };
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
  async getOrderById(id: string, user: any): Promise<IOrder | null> {
    const order = await OrderModel.findById(id).populate(
      "items.product items.variant user"
    );

    if (!order) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        `Order was not found with id: ${id}`
      );
    }

    // Check if the user is authorized to view the order
    if (order.user.toString() !== user.id) {
      throw new ApiError(
        HttpStatusCode.FORBIDDEN,
        "You are not authorized to view this order"
      );
    }

    return order;
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

  private calculateCart(items: ICartItem[]): {
    items: IOrderItem[];
    total_items: number;
    total_price: number;
  } {
    let total_items = 0;
    let total_price = 0;

    const orderItems: IOrderItem[] = items.map((cartItem) => {
      const subtotal = cartItem.price * cartItem.quantity;
      total_items += cartItem.quantity;
      total_price += subtotal;

      return {
        product: cartItem.product,
        variant: cartItem.variant,
        attributes: cartItem.attributes,
        quantity: cartItem.quantity,
        price: cartItem.price,
        subtotal,
      };
    });

    return { items: orderItems, total_items, total_price };
  }
}

export const OrderService = new Service();
