import { CartModel } from "./cart.model";

class Service {
  // when a customer registered, a cart should be created for them via event trigger
  async initiateCart(userId: string) {
    return await CartModel.create({ user: userId });
  }
}

export const CartService = new Service();
