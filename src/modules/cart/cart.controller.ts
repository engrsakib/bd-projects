import BaseController from "@/shared/baseController";
import { CartService } from "./cart.service";
import { Request, Response } from "express";
import { Types } from "mongoose";

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

  getMyCart = this.catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await CartService.getMyCart(userId);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Cart retrieved successfully",
      data: result,
    });
  });

  removeFromCart = this.catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const itemId = req.params.id as unknown as Types.ObjectId;
    const result = await CartService.removeFromCart(userId, itemId);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Item removed from cart successfully",
      data: result,
    });
  });
}

export const CartController = new Controller();
