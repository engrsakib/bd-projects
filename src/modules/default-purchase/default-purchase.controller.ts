import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
import { HttpStatusCode } from "@/lib/httpStatus";
import { DefaultsPurchaseService } from "./defult-purchase.service";

class Controller extends BaseController {
  // createPurchase = this.catchAsync(async (req: Request, res: Response) => {
  //   if (!req.body) {
  //     return this.sendResponse(res, {
  //       statusCode: HttpStatusCode.BAD_REQUEST,
  //       success: false,
  //       message: "Request body is required",
  //     });
  //   }

  //   if (!req.body.product || !req.body.unit_cost || !req.body.variant) {
  //     return this.sendResponse(res, {
  //       statusCode: HttpStatusCode.BAD_REQUEST,
  //       success: false,
  //       message: "Product, unit_cost, and variant are required",
  //     });
  //   }

  //   const data = await DefaultsPurchaseService.createPurchase(req.body);
  //   this.sendResponse(res, {
  //     statusCode: HttpStatusCode.CREATED,
  //     success: true,
  //     message: "Default purchase created successfully",
  //     data,
  //   });
  // });

  createPurchase = this.catchAsync(async (req: Request, res: Response) => {
    // ১. বডি চেক করা
    if (!req.body) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Request body is required",
      });
    }

    // ২. ইনপুটকে অ্যারেতে রূপান্তর করা (যদি সিঙ্গেল অবজেক্ট আসে তাও হ্যান্ডেল করবে)
    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
      return this.sendResponse(res, {
        statusCode: HttpStatusCode.BAD_REQUEST,
        success: false,
        message: "Payload cannot be an empty array",
      });
    }

    // ৩. প্রতিটি আইটেমের ভ্যালিডেশন চেক করা
    for (const item of items) {
      if (!item.product || item.unit_cost === undefined || !item.variant) {
        return this.sendResponse(res, {
          statusCode: HttpStatusCode.BAD_REQUEST,
          success: false,
          message: "Product, unit_cost, and variant are required for all items",
        });
      }
    }

    // ৪. প্যারালাল প্রসেসিং: সব আইটেম একসাথে সার্ভিসে পাঠানো
    // Promise.all ব্যবহার করে আমরা লুপের মাধ্যমে সার্ভিস কল করছি
    const data = await Promise.all(
      items.map(async (item) => {
        return await DefaultsPurchaseService.createPurchases([item]);
      })
    );

    // ৫. রেসপন্স পাঠানো
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Default purchases created/updated successfully",
      data, // এখানে আপডেট হওয়া সবগুলোর অ্যারে রিটার্ন করবে
    });
  });
}

export const DefaultsPurchaseController = new Controller();
