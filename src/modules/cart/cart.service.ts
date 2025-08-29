import mongoose, { Types } from "mongoose";
import { ICartItem } from "./cart.interface";
import { CartModel } from "./cart.model";

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
}

export const CartService = new Service();
