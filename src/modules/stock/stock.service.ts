import mongoose, { Types } from "mongoose";
import StockTransferHistoryModel from "./transfer.model";
import { StockModel } from "./stock.model";
import { IExpenseApplied } from "../purchase/purchase.interface";
import { IStock } from "./stock.interface";
import { ProductModel } from "../product/product.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { LotService } from "../lot/lot.service";
import { TransferService } from "../transfer/transfer.service";
import { ILot } from "../lot/lot.interface";
import { LotModel } from "../lot/lot.model";

const generateTransferNumber = async () => `TRF-${Date.now()}`;

class Service {
  // Updated transferStocks function
  // Changes made:
  // 1. Pre-generate transferId to use as ref in movements.
  // 2. When creating StockTransferHistoryModel, include _id: transferId.
  // 3. In the FIFO allocation loop for source (after updating source lot), create "transfer_out" movement with negative qty and source lot ref.
  // 4. When creating destination lot, get the created lot doc and create "transfer_in" movement with positive qty and new lot ref.
  // 5. Replaced TODO comments with actual movement creation.
  // No other logic changes; movements are logged per allocation (multiple per item if FIFO splits).
  async transferStocks(transferData: {
    from: string;
    to: string;
    items: Array<{ variant: string; qty: number; product: string }>;
    user_id?: string; // for audit if needed
    expenses_applied?: IExpenseApplied[];
  }) {
    // Start a session for transaction
    const session = await StockModel.startSession();
    session.startTransaction();

    try {
      if (transferData.from === transferData.to) {
        throw new Error("Source and destination outlets must be different.");
      }
      if (!transferData.items?.length) {
        throw new Error("No items to transfer.");
      }
      const transfer_number = await generateTransferNumber();
      const transferItemsPayload: any[] = [];

      // Pre-generate transferId for use in movement refs
      const transferId = new Types.ObjectId();

      // PROCESS EACH VARIANT
      for (const it of transferData.items) {
        const variantId = new Types.ObjectId(it.variant);
        const productId = new Types.ObjectId(it.product);
        const fromBusinessLocation = new Types.ObjectId(transferData.from);
        const toBusinessLocation = new Types.ObjectId(transferData.to);
        const requestedQty = it.qty;

        if (requestedQty <= 0) throw new Error("Transfer qty must be > 0");

        // 1) Read available qty at source (quick guard)
        const srcStock = await StockModel.findOne({
          variant: variantId,
          business_location: fromBusinessLocation,
        }).session(session);

        const available = srcStock?.available_quantity || 0;
        if (available < requestedQty) {
          throw new Error(
            `Insufficient available stock for variant ${variantId} at source.`
          );
        }

        // 2) FIFO allocation from source lots
        let remaining = requestedQty;
        const allocations: Array<{
          lot: ILot;
          qty: number;
          cost_per_unit: number;
        }> = [];

        const srcLots = await LotModel.find({
          variant: variantId,
          business_location: fromBusinessLocation,
          status: "active",
          qty_available: { $gt: 0 },
        })
          .sort({ received_at: 1 })
          .session(session);

        for (const lot of srcLots) {
          if (remaining <= 0) break;
          const take = Math.min(Number(remaining), Number(lot.qty_available));
          if (take <= 0) continue;

          // decrement from source lot
          lot.qty_available = Number(lot.qty_available) - take;
          //lot.qty_total = Number(lot.qty_total) - take; // current total physically left in that lot
          if (lot.qty_total < 0 || lot.qty_available < 0) {
            throw new Error("Lot math underflow");
          }
          // Set status to "closed" if qty_available becomes zero
          if (lot.qty_available === 0) {
            lot.status = "closed";
          }
          await lot.save({ session });

          allocations.push({
            lot: lot,
            qty: take,
            cost_per_unit: lot.cost_per_unit,
          });
          remaining -= take;

          // Added: Record transfer_out movement per allocation (replaces TODO)
          // await InventoryMovementModel.create(
          //   [
          //     {
          //       type: "transfer_out",
          //       ref: transferId, // Reference to the transfer doc
          //       variant: variantId,
          //       product: productId,
          //       business_location_from: fromBusinessLocation,
          //       business_location_to: toBusinessLocation,
          //       qty: -take, // Negative for out
          //       cost_per_unit: lot.cost_per_unit,
          //       lot: lot._id, // Source lot
          //       note: `transferred via ${transfer_number}`,
          //     },
          //   ],
          //   { session }
          // );
        }

        if (remaining > 0) {
          throw new Error("FIFO allocation failed: not enough available lots.");
        }
        // 3) Update stocks summary (source & destination)
        // source: available_quantity -= requestedQty
        await StockModel.updateOne(
          { variant: variantId, business_location: fromBusinessLocation },
          {
            $inc: { available_quantity: -requestedQty },
            $set: { updatedAt: new Date() },
          },
          { session }
        );

        // destination: upsert & add, and retrieve the document
        const destStock = await StockModel.findOneAndUpdate(
          { variant: variantId, business_location: toBusinessLocation },
          {
            $setOnInsert: {
              product: productId,
              qty_reserved: 0,
            },
            $inc: { available_quantity: requestedQty },
            $set: { updatedAt: new Date() },
          },
          { upsert: true, new: true, session }
        );

        // 4) Create destination lots from allocations (preserve received_at for FIFO aging)
        for (const a of allocations) {
          const src = a.lot;

          const newLotNumber = `${transfer_number}-${String(src._id).slice(-6)}`;

          // Create new lot and get the document
          const newLot = await LotService.createLot(
            {
              stock: destStock._id,
              variant: src.variant,
              product: src.product,
              location: toBusinessLocation,
              lot_number: newLotNumber,
              received_at: src.received_at, // preserve original date for FIFO
              cost_per_unit: src.cost_per_unit,
              qty_total: a.qty,
              qty_available: a.qty,
              source: {
                type: "transfer_in",
                ref_id: src._id as Types.ObjectId,
              },
              createdBy: transferData.user_id as string,
              status: "active",
            },
            session
          );

          console.log(newLot);

          // Added: Record transfer_in movement (replaces TODO)
          // await InventoryMovementModel.create(
          //   [
          //     {
          //       type: "transfer_in",
          //       ref: transferId, // Reference to the transfer doc
          //       variant: variantId,
          //       product: productId,
          //       business_location_from: fromBusinessLocation,
          //       business_location_to: toBusinessLocation,
          //       qty: a.qty, // Positive for in
          //       cost_per_unit: a.cost_per_unit,
          //       lot: newLot._id, // Destination lot
          //       note: `transferred via ${transfer_number}`,
          //     },
          //   ],
          //   { session }
          // );
        }

        // 5) Build transfer item payload (optional avg cost calc for reporting)
        const movedCostTotal = allocations.reduce(
          (s, a) => s + a.qty * a.lot.cost_per_unit,
          0
        );
        const avgCost = +(movedCostTotal / requestedQty).toFixed(2);
        console.log(`Average Cost for Transfer ${transferId}: ${avgCost}`);
        transferItemsPayload.push({
          variant: variantId,
          qty: requestedQty,
          allocations: allocations.map((a) => ({
            lot: a.lot._id,
            qty: a.qty,
            cost_per_unit: a.lot.cost_per_unit,
          })),
        });
      }
      // end for items

      // 6) Create Transfer doc (include _id)
      const transferPayload = {
        from: new Types.ObjectId(transferData.from),
        to: new Types.ObjectId(transferData.to),
        transferBy: transferData.user_id
          ? new Types.ObjectId(transferData.user_id)
          : undefined,
        expenses_applied: transferData.expenses_applied || [],
        items: transferItemsPayload,
      };
      const transferDoc = await TransferService.create(
        transferPayload,
        session
      );

      await session.commitTransaction();
      return transferDoc;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async transferHistoryByBusinessLocation({
    page,
    limit,
    business_location_id,
  }: {
    page: number;
    limit: number;
    business_location_id: string;
  }) {
    // Start a session for transaction
    const session = await StockTransferHistoryModel.startSession();
    session.startTransaction();

    try {
      const stockTransferHistory = await StockTransferHistoryModel.find({
        $or: [
          {
            from: business_location_id,
          },
          {
            to: business_location_id,
          },
        ],
      })
        .populate([
          {
            path: "from",
            model: "Business_location",
          },
          {
            path: "to",
            model: "Business_location",
          },
          {
            path: "transferBy",
            model: "User",
          },
          {
            path: "items.variant",
            model: "Variants",
          },
        ])
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session)
        .lean();

      const total = await StockTransferHistoryModel.countDocuments({
        $or: [
          {
            from: business_location_id,
          },
          {
            to: business_location_id,
          },
        ],
      }).session(session);

      await session.commitTransaction();
      return {
        meta: {
          total: total,
          page: page || 1,
          limit: limit || 10,
        },
        stockTransferHistory,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async transferHistoryForAdmin({
    page,
    limit,
    from,
    to,
  }: {
    page: number;
    limit: number;
    from?: string;
    to?: string;
  }) {
    // Start a session for transaction
    const session = await StockTransferHistoryModel.startSession();
    session.startTransaction();
    const query: any = {};
    if (from) {
      query.from = from;
    }
    if (to) {
      query.to = to;
    }

    try {
      const stockTransferHistory = await StockTransferHistoryModel.find(query)
        .populate([
          {
            path: "from",
            model: "Business_location",
          },
          {
            path: "to",
            model: "Business_location",
          },
          {
            path: "transferBy",
            model: "User",
          },
          {
            path: "items.variant",
            model: "Variants",
          },
        ])
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session)
        .lean();

      const total =
        await StockTransferHistoryModel.countDocuments(query).session(session);

      await session.commitTransaction();
      return {
        meta: {
          total: total,
          page: page || 1,
          limit: limit || 10,
        },
        stockTransferHistory,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getProductStock(slug: string): Promise<any> {
    // Start a session for transaction
    const session = await StockModel.startSession();
    session.startTransaction();

    try {
      // Find the product by slug
      const product = await ProductModel.findOne({ slug }).session(session);
      if (!product) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          "Product not found for the given slug: " + slug
        );
      }
      const inventory = await StockModel.find({ product: product?._id })
        .populate("outlet")
        .populate("warehouse")
        .session(session)
        .lean();

      await session.commitTransaction();
      return { inventory, product };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getStockById(id: string): Promise<IStock | null> {
    // Start a session for transaction
    const session = await StockModel.startSession();
    session.startTransaction();

    try {
      const inventory = await StockModel.findById(id)
        .populate("product outlet")
        .session(session)
        .lean();

      await session.commitTransaction();
      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStock(
    id: string,
    inventoryData: Partial<IStock>
  ): Promise<IStock | null> {
    // Start a session for transaction
    const session = await StockModel.startSession();
    session.startTransaction();

    try {
      const updatedStock = await StockModel.findByIdAndUpdate(
        id,
        inventoryData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("product outlet")
        .session(session)
        .lean();

      await session.commitTransaction();
      return updatedStock;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllStocks(filterOptions: {
    businessLocationId?: string;
    productId?: string;
    variantId?: string;
    categoryId?: string;
    subcategoryId?: string;
    sku?: string;
    searchQuery?: string;
    minQty?: number;
    maxQty?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      businessLocationId,
      productId,
      variantId,
      categoryId,
      subcategoryId,
      sku,
      searchQuery,
      minQty,
      maxQty,
      page = 1,
      limit = 20,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = filterOptions;

    const skip = (page - 1) * limit;

    const matchConditions: any = {};

    if (businessLocationId) {
      if (!mongoose.isValidObjectId(businessLocationId)) {
        throw new ApiError(400, "Invalid businessLocationId");
      }
      matchConditions.business_location = new mongoose.Types.ObjectId(
        businessLocationId
      );
    }

    if (productId && mongoose.isValidObjectId(productId)) {
      matchConditions.product = new mongoose.Types.ObjectId(productId);
    }
    if (variantId && mongoose.isValidObjectId(variantId)) {
      matchConditions.variant = new mongoose.Types.ObjectId(variantId);
    }
    if (minQty !== undefined || maxQty !== undefined) {
      matchConditions.available_quantity = {};
      if (minQty !== undefined)
        matchConditions.available_quantity.$gte = minQty;
      if (maxQty !== undefined)
        matchConditions.available_quantity.$lte = maxQty;
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchConditions },

      // --- Join Product ---
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // --- Join Variant ---
      {
        $lookup: {
          from: "variants",
          localField: "variant",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },

      // --- Category ---
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // --- Subcategory ---
      {
        $lookup: {
          from: "subcategories",
          localField: "product.subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },

      // --- Filter by category/subcategory ---
      ...(categoryId && mongoose.isValidObjectId(categoryId)
        ? [
            {
              $match: {
                "product.category": new mongoose.Types.ObjectId(categoryId),
              },
            },
          ]
        : []),

      ...(subcategoryId && mongoose.isValidObjectId(subcategoryId)
        ? [
            {
              $match: {
                "product.subcategory": new mongoose.Types.ObjectId(
                  subcategoryId
                ),
              },
            },
          ]
        : []),

      // --- SKU Filter ---
      ...(sku
        ? [{ $match: { "variant.sku": { $regex: sku, $options: "i" } } }]
        : []),

      // --- Search Query ---
      ...(searchQuery
        ? [
            {
              $match: {
                $or: [
                  { "product.name": { $regex: searchQuery, $options: "i" } },
                  { "variant.sku": { $regex: searchQuery, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      // --- Sorting ---
      { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },

      // --- Pagination ---
      { $skip: skip },
      { $limit: limit },
    ];

    // Run aggregation with facet to get total
    const [agg] = await StockModel.aggregate([
      { $match: matchConditions },
      {
        $facet: {
          data: pipeline,
          total: [{ $count: "total" }],
        },
      },
    ]);

    return {
      meta: {
        page,
        limit,
        total: agg?.total?.[0]?.total || 0,
      },
      data: agg?.data || [],
    };
  }

  async deleteStock(id: string): Promise<boolean> {
    // Start a session for transaction
    const session = await StockModel.startSession();
    session.startTransaction();

    try {
      const result = await StockModel.findByIdAndDelete(id).session(session);
      await session.commitTransaction();
      return !!result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const StockService = new Service();
