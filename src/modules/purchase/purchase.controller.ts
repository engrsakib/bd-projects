import BaseController from "@/shared/baseController";
import { PurchaseService } from "./purchase.service";

class Controller extends BaseController {
  createPurchase = this.catchAsync(async (req, res) => {
    const purchaseData = req.body;
    const newPurchase = await PurchaseService.createPurchase({
      ...purchaseData,
      created_by: req?.user?.id || req.body.created_by,
      received_by: req?.user?.id || req.body.received_by,
    });
    this.sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Purchase created successfully",
      data: newPurchase,
    });
  });

  getAllPurchases = this.catchAsync(async (req, res) => {
    const options = req.query;
    const filters = req.query;
    // console.log({filters,options});
    const purchases = await PurchaseService.getAllPurchases(options, filters);
    this.sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Purchases retrieved successfully",
      data: purchases,
    });
  });

  getPurchaseById = this.catchAsync(async (req, res) => {
    const { id } = req.params;
    const purchase = await PurchaseService.getPurchaseById(id);
    this.sendResponse(res, {
      statusCode: 200,
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
      statusCode: 200,
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
      statusCode: 200,
      success: true,
      message: "Purchase status updated successfully",
      data: updatedPurchase,
    });
  });

  deletePurchase = this.catchAsync(async (req, res) => {
    const { id } = req.params;
    await PurchaseService.deletePurchase(id);
    this.sendResponse(res, {
      statusCode: 204,
      success: true,
      message: "Purchase deleted successfully",
    });
  });
}

export const PurchaseController = new Controller();
