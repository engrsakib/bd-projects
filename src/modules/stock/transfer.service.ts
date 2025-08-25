import { parseDateRange } from "@/utils/parseDateRange";
import InventoryTransferHistoryModel from "./transfer.model";

export class Service {
  async getAllTransferInventory({
    endDate,
    limit,
    outletId,
    page,
    startDate,
    warehouseId,
  }: {
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    outletId?: string;
    warehouseId?: string;
  }) {
    const query: any = {};
    // Parse startDate and endDate
    const startRange = parseDateRange(startDate as string);
    const endRange = parseDateRange(endDate as string);
    // Build the query for createdAt
    if (startRange) {
      query.createdAt = {
        $gte: startRange.start,
      };
    }

    if (endRange) {
      query.createdAt = {
        ...query.createdAt,
        $lte: endRange.end,
      };
    }
    // Filter by outletId if provided
    if (outletId) {
      query.to = outletId;
    }

    // Filter by warehouseId if provided
    if (warehouseId) {
      query.from = warehouseId;
    }

    const transferredInventory = await InventoryTransferHistoryModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate([
        {
          path: "from",
          model: "Outlet",
        },
        {
          path: "to",
          model: "Outlet",
        },
        {
          path: "transferBy",
          model: "User",
        },
        // populate product
        {
          path: "products.product",
          model: "Products",
        },
      ])
      .sort({ createdAt: -1 })
      .lean();
    const totalCount =
      await InventoryTransferHistoryModel.countDocuments(query);

    return {
      data: transferredInventory,
      meta: {
        total: totalCount,
        page: page || 1,
        limit: limit || 10,
      },
    };
  }
  async getTransferInventoryById(inventory_transfer_history_id: string) {
    const inventoryTransferHistory =
      await InventoryTransferHistoryModel.findById(
        inventory_transfer_history_id
      ).populate([
        {
          path: "from",
          model: "Outlet",
        },
        {
          path: "to",
          model: "Outlet",
        },
        {
          path: "transferBy",
          model: "User",
        },
        {
          path: "products.product",
          model: "Products",
        },
      ]);

    return inventoryTransferHistory;
  }
}

export const TransferService = new Service();
