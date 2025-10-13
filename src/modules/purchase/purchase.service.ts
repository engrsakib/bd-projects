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
import { LotModel } from "./../lot/lot.model";
import { StockModel } from "../stock/stock.model";
import mongoose from "mongoose";

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
      // 1. Find existing purchase
      const existingPurchase = await PurchaseModel.findById(purchaseId)
        .lean()
        .session(session);
      if (!existingPurchase) {
        throw new Error("Purchase not found");
      }

      // 2. Recalculate purchase_number if location changed
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

      // 3. Calculate subtotal and expenses
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

      // 4. Update purchase document
      const updatedPurchase = await PurchaseModel.findByIdAndUpdate(
        purchaseId,
        { ...data },
        { new: true, session, lean: true }
      ).session(session);

      if (!updatedPurchase) {
        throw new Error("Purchase update failed");
      }

      // 5. Update stock & lot adjustments (revised logic)
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

        // Find old lots (created by this purchase)
        const oldLots = await LotModel.find({
          "source.type": "purchase",
          "source.ref_id": existingPurchase._id,
          product: item.product,
          variant: item.variant,
          location: data.location,
        }).session(session);

        const existingQty = oldLots.reduce(
          (sum, lot) => sum + (lot.qty_total || 0),
          0
        );

        const delta = (item.qty || 0) - existingQty;

        // Stock record
        const stockQuery = {
          product: item.product,
          variant: item.variant,
          location: data.location,
        };
        const stock = await StockModel.findOne(stockQuery).session(session);

        if (delta === 0) {
          // Quantity unchanged, only cost may change
          for (const lot of oldLots) {
            lot.cost_per_unit = effectiveUnitCost;
            await lot.save({ session });
          }
        } else if (delta > 0) {
          // Increase stock quantity
          if (!stock) {
            await StockModel.findOneAndUpdate(
              stockQuery,
              {
                $setOnInsert: {
                  product: item.product,
                  variant: item.variant,
                  location: data.location,
                },
                $inc: { available_quantity: delta, total_received: delta },
              },
              { upsert: true, new: true, session }
            );
          } else {
            await StockModel.findByIdAndUpdate(
              stock._id,
              { $inc: { available_quantity: delta, total_received: delta } },
              { session }
            );
          }

          // Create new lot for added qty
          const newLot = new LotModel({
            qty_available: delta,
            qty_total: delta,
            cost_per_unit: effectiveUnitCost,
            received_at: data.received_at,
            createdBy: data.created_by,
            variant: item.variant,
            product: item.product,
            location: data.location,
            source: { type: "purchase", ref_id: existingPurchase._id },
            lot_number:
              item.lot_number ||
              `PUR-${updatedPurchase.purchase_number}-${String(
                item.variant
              ).slice(-4)}`,
            expiry_date: item.expiry_date || null,
            status: "active",
            notes: "",
            stock: (stock && stock._id) || undefined,
          });
          await newLot.save({ session });
        } else {
          // delta < 0 → reduce inventory
          let toRemove = Math.abs(delta);
          const sortedLots = oldLots.sort((a, b) => {
            return (
              (b.received_at?.getTime() || b._id.getTimestamp().getTime()) -
              (a.received_at?.getTime() || a._id.getTimestamp().getTime())
            );
          });

          for (const lot of sortedLots) {
            if (toRemove === 0) break;
            const reducible = Math.min(toRemove, lot.qty_available || 0);

            await LotModel.findByIdAndUpdate(
              lot._id,
              {
                $inc: { qty_total: -reducible, qty_available: -reducible },
                ...(lot.qty_total - reducible <= 0 ? { status: "closed" } : {}),
              },
              { session }
            );

            await StockModel.findByIdAndUpdate(
              lot.stock,
              {
                $inc: {
                  available_quantity: -reducible,
                  total_received: -reducible,
                },
              },
              { session }
            );

            toRemove -= reducible;
          }
        }
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
      sku,
      status,
      supplier,
      received_at_end_date,
      received_at_start_date,
    } = filters;

    // Build main query
    const queries: any = {};

    if (supplier) queries.supplier = supplier;
    if (location) queries.location = location;
    if (status) queries.status = status;

    // Received date filter
    if (received_at_start_date || received_at_end_date) {
      queries.received_at = {};
      const receivedAtStartRange = parseDateRange(
        received_at_start_date as string
      );
      const receivedAtEndRange = parseDateRange(received_at_end_date as string);
      if (received_at_start_date)
        queries.received_at.$gte = receivedAtStartRange?.start;
      if (received_at_end_date)
        queries.received_at.$lte = receivedAtEndRange?.end;
    }

    // Created date filter
    const startCreateAtDateRange = parseDateRange(
      created_at_start_date as string
    );
    const endCreateAtDateRange = parseDateRange(created_at_end_date as string);
    if (created_at_start_date || created_at_end_date) queries.created_at = {};
    if (created_at_start_date)
      queries.created_at.$gte = startCreateAtDateRange?.start;
    if (created_at_end_date)
      queries.created_at.$lte = endCreateAtDateRange?.end;

    // Purchase date filter
    const startPurchaseDateRange = parseDateRange(
      purchase_date_start as string
    );
    const endPurchaseDateRange = parseDateRange(purchase_date_end as string);
    if (purchase_date_start || purchase_date_end) queries.purchase_date = {};
    if (purchase_date_start)
      queries.purchase_date.$gte = startPurchaseDateRange?.start;
    if (purchase_date_end)
      queries.purchase_date.$lte = endPurchaseDateRange?.end;

    // Purchase number filter
    if (purchase_number)
      queries.purchase_number = parseInt(purchase_number as string, 10);

    // Efficient SKU filter inside items.variant.sku using aggregation
    let purchases: any[] = [];
    let total = 0;

    if (sku) {
      // Aggregation pipeline for SKU filtering
      const pipeline: any[] = [
        { $match: queries },
        {
          $lookup: {
            from: "variants",
            localField: "items.variant",
            foreignField: "_id",
            as: "variants_docs",
          },
        },
        // Match any items.variant with requested sku
        {
          $match: {
            "variants_docs.sku": sku,
          },
        },
        // Usual populates
        {
          $lookup: {
            from: "locations",
            localField: "location",
            foreignField: "_id",
            as: "location",
          },
        },
        { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "admins",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
          },
        },
        { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "admins",
            localField: "received_by",
            foreignField: "_id",
            as: "received_by",
          },
        },
        { $unwind: { path: "$received_by", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "variants",
            localField: "items.variant",
            foreignField: "_id",
            as: "items_variant",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "items_product",
          },
        },
        // Sorting, skipping, limiting
        { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit },
      ];
      purchases = await PurchaseModel.aggregate(pipeline);
      // Count total with matching pipeline (without pagination)
      const totalPipeline = pipeline.filter(
        (stage) =>
          !("$skip" in stage) && !("$limit" in stage) && !("$sort" in stage)
      );
      total =
        (
          await PurchaseModel.aggregate([...totalPipeline, { $count: "count" }])
        )[0]?.count || 0;
    } else {
      // If no SKU, use normal query + populate (faster for non-SKU queries)
      purchases = await PurchaseModel.find(queries)
        .populate([
          { path: "location", model: "Location" },
          { path: "supplier", model: "Supplier" },
          { path: "created_by", model: "Admin", select: "-password" },
          { path: "received_by", model: "Admin", select: "-password" },
          { path: "items.variant", model: "Variant" },
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
      total = await PurchaseModel.countDocuments(queries);
    }

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: purchases,
    };
  }

  async getPurchaseByQuery(id?: string, sku?: string): Promise<any | null> {
    const pipeline: any[] = [];

    if (id) {
      pipeline.push({
        $match: {
          purchase_number: isNaN(Number(id)) ? id : Number(id),
        },
      });
    }

    pipeline.push({ $unwind: "$items" });

    if (sku) {
      pipeline.push(
        {
          $lookup: {
            from: "variants",
            localField: "items.variant",
            foreignField: "_id",
            as: "item_variant_doc",
          },
        },
        { $unwind: "$item_variant_doc" },
        {
          $match: {
            "item_variant_doc.sku": sku,
          },
        }
      );
    }

    pipeline.push({
      $group: {
        _id: "$_id",
        purchase_number: { $first: "$purchase_number" },
        purchase_date: { $first: "$purchase_date" },
        created_by: { $first: "$created_by" },
        received_by: { $first: "$received_by" },
        received_at: { $first: "$received_at" },
        location: { $first: "$location" },
        supplier: { $first: "$supplier" },
        total_cost: { $first: "$total_cost" },
        expenses_applied: { $first: "$expenses_applied" },
        attachments: { $first: "$attachments" },
        additional_note: { $first: "$additional_note" },
        status: { $first: "$status" },
        items: { $push: "$items" },
      },
    });

    pipeline.push(
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } }
    );

    pipeline.push(
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } }
    );

    pipeline.push(
      {
        $lookup: {
          from: "admins",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } }
    );

    pipeline.push(
      {
        $lookup: {
          from: "admins",
          localField: "received_by",
          foreignField: "_id",
          as: "received_by",
        },
      },
      { $unwind: { path: "$received_by", preserveNullAndEmptyArrays: true } }
    );

    // Fully populate items.variant and items.product
    pipeline.push({
      $lookup: {
        from: "variants",
        localField: "items.variant",
        foreignField: "_id",
        as: "items_variant_full",
      },
    });
    pipeline.push({
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "items_product_full",
      },
    });

    pipeline.push({
      $project: {
        purchase_number: 1,
        purchase_date: 1,
        created_by: 1,
        received_by: 1,
        received_at: 1,
        location: 1,
        supplier: 1,
        total_cost: 1,
        expenses_applied: 1,
        attachments: 1,
        additional_note: 1,
        status: 1,
        // items: 1, <-- we'll manually assign after populating
        items_variant_full: 1,
        items_product_full: 1,
        items: 1,
      },
    });

    const result = await PurchaseModel.aggregate(pipeline);
    const purchase = result[0] || null;

    // ---- Lot info fetch & attach ----
    if (purchase) {
      let qty_total_sum = 0;
      let qty_available_sum = 0;
      let total_sold_sum = 0;

      const lots: any[] = [];

      // Map for quick lookup
      const variantMap: Record<string, any> = {};
      const productMap: Record<string, any> = {};
      if (purchase.items_variant_full) {
        for (const v of purchase.items_variant_full) {
          variantMap[String(v._id)] = v;
        }
      }
      if (purchase.items_product_full) {
        for (const p of purchase.items_product_full) {
          productMap[String(p._id)] = p;
        }
      }

      // Fully populate items with variant/product
      if (purchase.items) {
        purchase.items = purchase.items.map((item: any) => ({
          ...item,
          variant: variantMap[String(item.variant)] || item.variant,
          product: productMap[String(item.product)] || item.product,
        }));
      }

      for (const item of purchase.items) {
        const lot = await LotModel.findOne({
          "source.ref_id": purchase._id,
          "source.type": "purchase",
          variant: item.variant?._id ?? item.variant,
        })
          .populate("variant")
          .populate("product")
          .lean();

        if (lot) {
          lots.push(lot);
          qty_total_sum += lot.qty_total ?? 0;
          qty_available_sum += lot.qty_available ?? 0;
          total_sold_sum += (lot.qty_total ?? 0) - (lot.qty_available ?? 0);
        }
      }

      // attach only numbers, no object id keys
      purchase.qty_total = qty_total_sum;
      purchase.qty_available = qty_available_sum;
      purchase.total_sold = total_sold_sum;
      purchase.lots = lots;
    }

    return purchase;
  }

  async getPurchaseById(id: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const pipeline: any[] = [];

    // Step 1: Match specific purchase by ObjectId
    pipeline.push({
      $match: { _id: objectId },
    });

    // Step 2: Unwind items
    pipeline.push({ $unwind: "$items" });

    // Step 3: Lookup product & variant (with all fields)
    pipeline.push(
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product_info",
        },
      },
      { $unwind: { path: "$product_info", preserveNullAndEmptyArrays: true } }
    );

    pipeline.push(
      {
        $lookup: {
          from: "variants",
          localField: "items.variant",
          foreignField: "_id",
          as: "variant_info",
        },
      },
      { $unwind: { path: "$variant_info", preserveNullAndEmptyArrays: true } }
    );

    // Step 4: Replace IDs with full objects
    pipeline.push({
      $addFields: {
        "items.product": "$product_info",
        "items.variant": "$variant_info",
      },
    });

    // Step 5: Clean helper
    pipeline.push({
      $project: {
        product_info: 0,
        variant_info: 0,
      },
    });

    // Step 6: Re-group
    pipeline.push({
      $group: {
        _id: "$_id",
        purchase_number: { $first: "$purchase_number" },
        purchase_date: { $first: "$purchase_date" },
        created_by: { $first: "$created_by" },
        received_by: { $first: "$received_by" },
        received_at: { $first: "$received_at" },
        location: { $first: "$location" },
        supplier: { $first: "$supplier" },
        total_cost: { $first: "$total_cost" },
        expenses_applied: { $first: "$expenses_applied" },
        attachments: { $first: "$attachments" },
        additional_note: { $first: "$additional_note" },
        status: { $first: "$status" },
        items: { $push: "$items" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    });

    // Step 7: Populate all reference fields with ALL FIELDS
    const lookups = [
      { from: "locations", localField: "location", as: "location" },
      { from: "suppliers", localField: "supplier", as: "supplier" },
      { from: "admins", localField: "created_by", as: "created_by" },
      { from: "admins", localField: "received_by", as: "received_by" },
    ];

    for (const l of lookups) {
      pipeline.push(
        {
          $lookup: {
            from: l.from,
            localField: l.localField,
            foreignField: "_id",
            as: l.as,
          },
        },
        { $unwind: { path: `$${l.as}`, preserveNullAndEmptyArrays: true } }
      );
    }

    // Step 8: Don't limit projection (all fields)
    pipeline.push({
      $project: {
        _id: 1,
        purchase_number: 1,
        purchase_date: 1,
        created_by: 1,
        received_by: 1,
        received_at: 1,
        location: 1,
        supplier: 1,
        total_cost: 1,
        expenses_applied: 1,
        attachments: 1,
        additional_note: 1,
        status: 1,
        items: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // Step 9: Run aggregation
    const result = await PurchaseModel.aggregate(pipeline);
    const purchase = result[0] || null;

    // Step 10: Attach Lot info (unique per variant) & move qty fields into items
    if (purchase) {
      const lots: any[] = [];

      // Build a map: productId -> qty_total, qty_available, total_sold
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const itemStatsMap: Record<
        string,
        { qty_total: number; qty_available: number; total_sold: number }
      > = {};

      // For each item (product+variant), get its lot, calculate stats and attach to each item
      for (const item of purchase.items) {
        const lot = await LotModel.findOne({
          "source.ref_id": objectId,
          "source.type": "purchase",
          variant: item.variant?._id,
        })
          .populate("variant")
          .populate("product")
          .populate("createdBy")
          // .populate("location")
          .lean();

        if (lot) {
          lots.push(lot);

          // qty logic for this product/variant
          const qty_total = lot.qty_total ?? 0;
          const qty_available = lot.qty_available ?? 0;
          const total_sold = qty_total - qty_available;

          // Attach these fields inside item object
          item.qty_total = qty_total;
          item.qty_available = qty_available;
          item.total_sold = total_sold;
        } else {
          // No lot found, default to 0
          item.qty_total = 0;
          item.qty_available = 0;
          item.total_sold = 0;
        }
      }

      purchase.lots = lots.length === 1 ? lots[0] : lots;

      // Remove qty fields from root
      // (Do not add purchase.qty_total, purchase.qty_available, purchase.total_sold)
    }

    return purchase;
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
