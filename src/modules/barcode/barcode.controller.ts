import BaseController from "@/shared/baseController";
import { Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Types } from "mongoose";
import { UniqueBarcodeService } from "./barcode.service";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";
import { HttpStatusCode } from "@/lib/httpStatus";
import ApiError from "@/middlewares/error";

class Controller extends BaseController {
  crateBarcodeForStock = this.catchAsync(
    async (req: Request, res: Response) => {
      const { sku, product_count, admin_note } = req.body;

      if (!sku || !product_count) {
        this.sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "SKU and product_count are required",
        });
        return;
      }
      const user = req.user;
      //   console.log(user, "user data update")
      const result = await UniqueBarcodeService.crateBarcodeForStock(
        sku,
        product_count,
        admin_note,
        user
      );
      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Barcodes created successfully",
        data: result,
      });
    }
  );

  updateBarcodeStatus = this.catchAsync(async (req: Request, res: Response) => {
    const { barcode, status, conditions, admin_note } = req.body;

    if (!barcode || !status) {
      this.sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Barcode and status are required",
      });
      return;
    }

    const user = req.user as { name?: string; role?: string } | undefined;
    if (!user || !user.name || !user.role) {
      this.sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized: user info missing",
      });
      return;
    }

    const updated_by = {
      name: user.name,
      role: user.role,
      date: new Date(),
    };

    // If your service requires `conditions`, ensure it's present or set a default
    // (adjust default according to your domain)
    const finalConditions =
      typeof conditions !== "undefined"
        ? (conditions as productBarcodeCondition)
        : productBarcodeCondition.NEW; // <-- or throw error if required

    // Optionally validate status/conditions are valid enum values here

    const result = await UniqueBarcodeService.updateBarcodeStatus(
      barcode,
      status as productBarcodeStatus,
      finalConditions,
      updated_by,
      admin_note // optional
    );

    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Barcode status updated successfully",
      data: result,
    });
  });

  getBarcodesBySku = this.catchAsync(async (req: Request, res: Response) => {
    // read optional query params
    const barcode =
      typeof req.query.barcode === "string" ? req.query.barcode : "";

    const sku = req.query.sku as string;
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.max(
      1,
      parseInt(String(req.query.limit ?? "10"), 10) || 10
    );

    let is_used_barcode: boolean | undefined;
    const rawVal = req.query.is_used_barcode;

    if (typeof rawVal !== "undefined") {
      const first = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      const trimmed = String(first).trim();

      if (trimmed === "") {
        is_used_barcode = undefined;
      } else {
        const lower = trimmed.toLowerCase();
        is_used_barcode = lower === "true" || lower === "1" ? true : false;
      }
    }
    const result = await UniqueBarcodeService.getBarcodesBySku(sku, barcode, {
      page,
      limit,
      is_used_barcode,
      status:
        typeof req.query.status === "string" ? req.query.status : undefined,
      conditions:
        typeof req.query.conditions === "string"
          ? req.query.conditions
          : undefined,
    });

    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Barcodes retrieved successfully",
      data: result,
    });
  });

  getBarcodeDetails = this.catchAsync(async (req: Request, res: Response) => {
    const barcode = req.params.barcode;
    if (!barcode) {
      this.sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Barcode is required",
      });
      return;
    }
    const result = await UniqueBarcodeService.getBarcodeDetails(barcode);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Barcode details retrieved successfully",
      data: result,
    });
  });

  checkBarcodeUsedOrNot = this.catchAsync(
    async (req: Request, res: Response) => {
      const barcode = req.params.barcode;
      if (!barcode) {
        this.sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Barcode is required",
        });
        return;
      }
      const result = await UniqueBarcodeService.checkBarcodeUsedOrNot(barcode);
      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Barcode usage status retrieved successfully",
        data: result,
      });
    }
  );

  createPurchaseFromBarcodes = this.catchAsync(
    async (req: Request, res: Response) => {
      const { barcodes, location, received_by, purchase_date, admin_note } =
        req.body;

      if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        this.sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Barcodes array is required",
        });
        return;
      }

      if (!location) {
        this.sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "location is required",
        });
        return;
      }

      const user = req.user as any;
      if (!user || !(user._id || user.id) || !user.name || !user.role) {
        this.sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized: user info missing",
        });
        return;
      }

      // Build args for service according to its signature
      const created_by = new Types.ObjectId(user._id ?? user.id);
      const receivedBy = received_by
        ? new Types.ObjectId(received_by)
        : created_by;
      const purchaseDate = purchase_date ? new Date(purchase_date) : new Date();
      const updated_by = {
        name: user.name,
        role: user.role,
        date: new Date(),
      };

      // Call service (location may be provided as string/ObjectId)
      const locationId = new Types.ObjectId(location);

      const result = await UniqueBarcodeService.createPurchaseFromBarcodes(
        barcodes,
        locationId,
        created_by,
        receivedBy,
        purchaseDate,
        updated_by,
        admin_note
      );

      this.sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Purchase created successfully from barcodes",
        data: result,
      });
    }
  );

  processOrderBarcodes = this.catchAsync(
    async (req: Request, res: Response) => {
      const { order_id: orderId } = req.params;
      const { barcodes } = req.body;

      console.log(orderId, "order id");
      if (!orderId) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Order ID is required");
      }
      if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Barcodes array is required"
        );
      }

      const user = req.user as any;
      if (!user) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authorized");
      }

      const updatedBy = {
        name: user.name || "Unknown Staff",
        role: user.role,
        date: new Date(),
      };

      const result = await UniqueBarcodeService.processOrderBarcodes(
        orderId,
        barcodes,
        updatedBy
      );

      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Barcodes assigned and stock updated successfully",
        data: result,
      });
    }
  );

  checkIsBarcodeExistsAndReadyForUse = this.catchAsync(
    async (req: Request, res: Response) => {
      const { id: orderId } = req.params;
      const { barcode } = req.query;

      // 1. Validation
      if (!orderId) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Order ID is required");
      }
      if (!barcode || typeof barcode !== "string") {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Barcode is required and must be a string"
        );
      }

      // 2. Call Service
      const result =
        await UniqueBarcodeService.checkIsBarcodeExistsAndReadyForUse(
          orderId,
          barcode
        );

      // 3. Send Response
      this.sendResponse(res, {
        statusCode: HttpStatusCode.OK,
        success: true,
        message: "Barcode is valid and ready for use",
        data: result,
      });
    }
  );
}

export const UniqueBarcodeController = new Controller();
