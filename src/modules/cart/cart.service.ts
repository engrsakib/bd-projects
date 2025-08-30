import mongoose, { Types } from "mongoose";
import { ICartItem } from "./cart.interface";
import { CartModel } from "./cart.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

class Service {
  // when a customer registered, a cart should be created for them via event trigger
  async initiateCart(userId: string) {
    return await CartModel.create({ user: userId });
  }

  async addToCart(userId: Types.ObjectId, data: ICartItem) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Add item (or update quantity if exists)
      await CartModel.findOneAndUpdate(
        { user: userId },
        { $addToSet: { items: data } },
        { upsert: true, new: true, session }
      );

      // Step 2: Recalculate & update total in one go
      const cart = await CartModel.findOne({ user: userId }).session(session);
      if (!cart) throw new Error("Cart not found after insert");

      const total_price = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      cart.total_price = total_price;
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      return cart;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async getMyCart(userId: Types.ObjectId) {
    return await CartModel.findOne({ user: userId }).populate(
      "items.product",
      "name thumbnail slug sku"
    );
  }

  async updateACartItem(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    updateData: Partial<ICartItem>
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cart = await CartModel.findOne({ user: userId }).session(session);
      if (!cart) throw new ApiError(HttpStatusCode.NOT_FOUND, "Cart not found");

      const itemIndex = cart.items.findIndex((item) => item._id.equals(itemId));
      if (itemIndex === -1)
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Item not found in cart");

      cart.items[itemIndex] = { ...cart.items[itemIndex], ...updateData };

      // recalculate total price
      const total_price = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      cart.total_price = total_price;

      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      return cart;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to update cart item"
      );
    }
  }

  async removeFromCart(userId: Types.ObjectId, itemId: Types.ObjectId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cart = await CartModel.findOneAndUpdate(
        { user: userId },
        { $pull: { items: { _id: itemId } } },
        { new: true, session }
      );

      if (!cart) throw new Error("Cart not found");

      // Recalculate & update total in one go
      const total_price = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      cart.total_price = total_price;
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      return cart;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

export const CartService = new Service();
