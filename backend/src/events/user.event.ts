import { CartService } from "@/modules/cart/cart.service";
import { emitter } from "./eventEmitter";

// receive event when a customer register and initiate a cart
emitter.on("user.registered", async (userId) => {
  console.log(`✅ User registered event received for userId: ${userId}`);
  const result = await CartService.initiateCart(userId);
  console.log(`🛒 Cart created for userId: ${userId}`, result);
});
