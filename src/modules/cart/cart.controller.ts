import BaseController from "@/shared/baseController";
import { CartService } from "./cart.service";
import { Request, Response } from "express";

class Controller extends BaseController {
  addToCart = this.catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const cartItem = req.body;
    const result = await CartService.addToCart(userId, cartItem);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Item added to cart successfully",
      data: result,
    });
  });
}

export const CartController = new Controller();
