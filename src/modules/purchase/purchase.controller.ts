import BaseController from "@/shared/baseController";
import { PurchaseService } from "./purchase.service";
import { HttpStatusCode } from "@/lib/httpStatus";

class Controller extends BaseController {
  createPurchase = this.catchAsync(async (req, res) => {
    const purchaseData = req.body;
    const newPurchase = await PurchaseService.createPurchase({
      ...purchaseData,
      created_by: req?.user?.id || req.body.created_by,
      received_by: req?.user?.id || req.body.received_by,
    });
    this.sendResponse(res, {
      statusCode: HttpStatusCode.CREATED,
      success: true,
      message: "Purchase created successfully",
      data: newPurchase,
    });
  });

  getAllPurchases = this.catchAsync(async (req, res) => {
    const options = req.query;
    const filters = req.query;
    const purchases = await PurchaseService.getAllPurchases(options, filters);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Purchases retrieved successfully",
      data: purchases,
    });
  });

  getPurchaseByQuery = this.catchAsync(async (req, res) => {
    const { purchase_number, sku } = req.query;
    const purchase = await PurchaseService.getPurchaseByQuery(
      purchase_number as string,
      sku as string
    );

    console.log(sku, "sku in controller");
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Purchase retrieved successfully",
      data: purchase,
    });
  });

  getPurchaseById = this.catchAsync(async (req, res) => {
    const { id } = req.params;
    const purchase = await PurchaseService.getPurchaseById(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Purchase retrieved successfully",
      data: purchase,
    });
  });

  updatePurchase = this.catchAsync(async (req, res) => {
    const { id } = req.params;
    const purchaseData = req.body;
    const updatedPurchase = await PurchaseService.updatePurchase(
      id,
      purchaseData
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Purchase updated successfully",
      data: updatedPurchase,
    });
  });

  updateStatus = this.catchAsync(async (req, res) => {
    const { id } = req.params;
    const updatedPurchase = await PurchaseService.updateStatus(
      id,
      req.body.status
    );
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Purchase status updated successfully",
      data: updatedPurchase,
    });
  });

  deletePurchase = this.catchAsync(async (req, res) => {
    const { id } = req.params;
    await PurchaseService.deletePurchase(id);
    this.sendResponse(res, {
      statusCode: HttpStatusCode.OK,
      success: true,
      message: "Purchase deleted successfully",
    });
  });
}

export const PurchaseController = new Controller();
