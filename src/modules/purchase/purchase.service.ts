import { Types } from "mongoose";
import { PurchaseModel } from "./purchase.model";
import {
  IPurchase,
  IPurchaseFilters,
  IPurchaseStatus,
} from "./purchase.interface";
import { parseDateRange } from "@/utils/parseDateRange";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { StockService } from "../stock/stock.service";
import { LotService } from "../lot/lot.service";

class Service {
  async createPurchase(data: IPurchase): Promise<IPurchase> {
    const session = await PurchaseModel.startSession();
    session.startTransaction();
    try {
      const purchase_number =
        (await PurchaseModel.countDocuments({
          location: data.location,
        }).session(session)) + 1;
      data.purchase_number = purchase_number;
      // Calculate subtotal from items
      let subtotal = 0;
      for (const item of data.items) {
        const itemTotal =
          item.qty * item.unit_cost - (item.discount || 0) + (item.tax || 0);
        subtotal += itemTotal;
      }

      // Calculate total expenses
      let totalExpenses = 0;
      for (const expense of data.expenses_applied || []) {
        totalExpenses += expense.amount;
      }

      // Set total_cost on the purchase data
      data.total_cost = subtotal + totalExpenses;

      // Pre-generate purchaseId for use in movement refs
      const purchaseId = new Types.ObjectId();

      // Create and save the purchase (include _id)
      const purchase = await new PurchaseModel({
        ...data,
        _id: purchaseId,
      }).save({ session });

      // Process each item to update/create stock and create lot
      for (const item of data.items) {
        const itemTotal =
          item.qty * item.unit_cost - (item.discount || 0) + (item.tax || 0);
        const apportionedExpense =
          subtotal > 0 ? (itemTotal / subtotal) * totalExpenses : 0;
        const effectiveUnitCost =
          item.qty > 0
            ? (itemTotal + apportionedExpense) / item.qty
            : item.unit_cost;

        // Upsert stock
        const stockQuery = {
          product: item.product,
          variant: item.variant,
          location: data.location,
        };
        const stock = await StockService.findOneAndUpdateByPurchase(
          stockQuery,
          {
            product: item.product,
            variant: item.variant,
            location: data.location,
            available_quantity: item.qty,
            total_received: item.qty,
          },
          session
        );

        // Create lot
        await LotService.createLot(
          {
            qty_available: item.qty,
            cost_per_unit: effectiveUnitCost,
            received_at: data.received_at || Date.now(),
            createdBy: data.created_by,
            variant: item.variant,
            product: item.product,
            location: data.location,
            source: {
              type: "purchase",
              ref_id: purchase._id,
            },
            lot_number:
              item.lot_number ||
              `PUR-${purchase.purchase_number}-${String(item.variant).slice(-4)}`,
            expiry_date: item.expiry_date || null,
            qty_total: item.qty,
            qty_reserved: 0,
            status: "active",
            notes: "",
            stock: stock._id,
          },
          session
        );
      }

      await session.commitTransaction();
      return purchase;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updatePurchase(
    purchaseId: string,
    data: IPurchase
  ): Promise<IPurchase> {
    const session = await PurchaseModel.startSession();
    session.startTransaction();
    try {
      const existingPurchase = await PurchaseModel.findById(purchaseId)
        .lean()
        .session(session);
      if (!existingPurchase) {
        throw new Error("Purchase not found");
      }

      const newLocationString = String(data.location);
      const existingLocationString = String(existingPurchase.location);

      if (data.location && newLocationString !== existingLocationString) {
        const purchase_number =
          (await PurchaseModel.countDocuments({
            location: data.location,
          }).session(session)) + 1;
        data.purchase_number = purchase_number;
      } else {
        data.purchase_number = existingPurchase.purchase_number;
      }

      let subtotal = 0;
      for (const item of data.items) {
        const itemTotal =
          item.qty * item.unit_cost - (item.discount || 0) + (item.tax || 0);
        subtotal += itemTotal;
      }

      let totalExpenses = 0;
      for (const expense of data.expenses_applied || []) {
        totalExpenses += expense.amount;
      }

      data.total_cost = subtotal + totalExpenses;

      const updatedPurchase = await PurchaseModel.findByIdAndUpdate(
        purchaseId,
        { ...data },
        { new: true, session, lean: true }
      ).session(session);

      if (!updatedPurchase) {
        throw new Error("Purchase update failed");
      }

      // Update stock & create lots
      for (const item of data.items) {
        if (!item.product || !item.variant) {
          throw new Error("Item must have product and variant");
        }
        const itemTotal =
          item.qty * item.unit_cost - (item.discount || 0) + (item.tax || 0);
        const apportionedExpense =
          subtotal > 0 ? (itemTotal / subtotal) * totalExpenses : 0;
        const effectiveUnitCost =
          item.qty > 0
            ? (itemTotal + apportionedExpense) / item.qty
            : item.unit_cost;

        const stockQuery = {
          product: item.product,
          variant: item.variant,
          location: data.location,
        };
        const stock = await StockService.findOneAndUpdateByPurchase(
          stockQuery,
          {
            product: item.product,
            variant: item.variant,
            location: data.location,
            available_quantity: item.qty,
            total_received: item.qty,
          },
          session
        );

        await LotService.createLot(
          {
            qty_available: item.qty,
            cost_per_unit: effectiveUnitCost,
            received_at: data.received_at || new Date(),
            createdBy: data.created_by,
            variant: item.variant,
            product: item.product,
            location: data.location,
            source: {
              type: "purchase",
              ref_id: updatedPurchase._id,
            },
            lot_number:
              item.lot_number ||
              `PUR-${updatedPurchase.purchase_number}-${String(item.variant).slice(-4)}`,
            expiry_date: item.expiry_date || null,
            qty_total: item.qty,
            qty_reserved: 0,
            status: "active",
            notes: "",
            stock: stock._id,
          },
          session
        );
      }

      await session.commitTransaction();
      return updatedPurchase as IPurchase;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllPurchases(
    options: IPaginationOptions,
    filters: IPurchaseFilters
  ) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const {
      location,
      created_at_end_date,
      created_at_start_date,
      purchase_date_end,
      purchase_date_start,
      purchase_number,
      status,
      supplier,
      received_at_end_date,
      received_at_start_date,
    } = filters;
    const startCreateAtDateRange = parseDateRange(
      created_at_start_date as string
    );
    const endCreateAtDateRange = parseDateRange(created_at_end_date as string);
    const startPurchaseDateRange = parseDateRange(
      purchase_date_start as string
    );
    const endPurchaseDateRange = parseDateRange(purchase_date_end as string);
    const receivedAtStartRange = parseDateRange(
      received_at_start_date as string
    );
    const receivedAtEndRange = parseDateRange(received_at_end_date as string);
    const queries: any = {};

    if (supplier) {
      queries.supplier = supplier;
    }
    if (location) {
      queries.location = location;
    }
    if (status) {
      queries.status = status;
    }
    if (received_at_start_date || received_at_end_date) {
      queries.received_at = {};
    }
    if (received_at_start_date) {
      queries.received_at.$gte = receivedAtStartRange?.start;
    }

    if (received_at_end_date) {
      queries.received_at.$lte = receivedAtEndRange?.end;
    }
    if (startCreateAtDateRange || endCreateAtDateRange) {
      queries.created_at = {};
    }
    if (startCreateAtDateRange) {
      queries.created_at.$gte = startCreateAtDateRange.start;
    }
    if (endCreateAtDateRange) {
      queries.created_at.$lte = endCreateAtDateRange.end;
    }
    if (startPurchaseDateRange || endPurchaseDateRange) {
      queries.purchase_date = {};
    }
    if (startPurchaseDateRange) {
      queries.purchase_date.$gte = startPurchaseDateRange.start;
    }
    if (endPurchaseDateRange) {
      queries.purchase_date.$lte = endPurchaseDateRange.end;
    }
    if (purchase_number) {
      queries.purchase_number = parseInt(purchase_number as string, 10);
    }

    const purchases = await PurchaseModel.find(queries)
      .populate([
        {
          path: "location",
          model: "Location",
        },
        {
          path: "supplier",
          model: "Supplier",
        },
        {
          path: "created_by",
          model: "Admin",
          select: "-password",
        },
        {
          path: "received_by",
          model: "Admin",
          select: "-password",
        },
        {
          path: "items.variant",
          model: "Variant",
        },
        {
          path: "items.product",
          model: "Product",
          select: "name slug sku thumbnail category",
        },
      ])
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await PurchaseModel.countDocuments(queries);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: purchases,
    };
  }

  async getPurchaseById(id: string): Promise<IPurchase | null> {
    const result = await PurchaseModel.findById(id)
      .populate([
        {
          path: "location",
          model: "Location",
        },
        {
          path: "supplier",
          model: "Supplier",
        },
        {
          path: "created_by",
          model: "Admin",
          select: "-password",
        },
        {
          path: "received_by",
          model: "Admin",
          select: "-password",
        },
        {
          path: "items.variant",
          model: "Variant",
        },
        {
          path: "items.product",
          model: "Product",
          select: "name slug sku thumbnail category",
        },
      ])
      .exec();

    return result;
  }

  async updateStatus(
    id: string,
    status: IPurchaseStatus
  ): Promise<IPurchase | null> {
    return PurchaseModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).exec();
  }

  async deletePurchase(id: string): Promise<IPurchase | null> {
    return PurchaseModel.findByIdAndDelete(id).exec();
  }
}

export const PurchaseService = new Service();
