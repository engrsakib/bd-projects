import mongoose, { Types } from "mongoose";
import { StockModel } from "./stock.model";
import { IStock, IStockFilters } from "./stock.interface";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { LotService } from "../lot/lot.service";
import { TransferService } from "../transfer/transfer.service";
import { ILot } from "../lot/lot.interface";
import { LotModel } from "../lot/lot.model";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { ProductService } from "../product/product.service";
import { ITransfer } from "../transfer/transfer.interface";
import { ProductModel } from "../product/product.model";
import { VariantModel } from "../variant/variant.model";

class Service {
  private async generateTransferNumber(): Promise<string> {
    return `TRF-${Date.now()}`;
  }
  // this is for purchase service
  async findOneAndUpdateByPurchase(
    params: {
      product: string | Types.ObjectId;
      variant: string | Types.ObjectId;
      location: string | Types.ObjectId;
    },
    data: {
      product: string | Types.ObjectId;
      variant: string | Types.ObjectId;
      location: string | Types.ObjectId;
      available_quantity: number;
      total_received: number;
    },
    session: mongoose.mongo.ClientSession
  ) {
    const stock = await StockModel.findOneAndUpdate(
      params,
      {
        $setOnInsert: {
          product: data.product,
          variant: data.variant,
          location: data.location,
        },
        $inc: {
          available_quantity: data.available_quantity,
          total_received: data.total_received,
        },
      },
      { upsert: true, new: true, session }
    );

    return stock;
  }

  async transferStocks(transferData: ITransfer) {
    // Start a session for transaction
    const session = await StockModel.startSession();
    session.startTransaction();

    try {
      if (transferData.from === transferData.to) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Source and destination outlets must be different."
        );
      }

      if (!transferData.items?.length) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "No items to transfer.");
      }
      const transfer_number = await this.generateTransferNumber();
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

        if (requestedQty <= 0)
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Transfer qty must be > 0"
          );

        // 1) Read available qty at source (quick guard)
        const srcStock = await StockModel.findOne({
          variant: variantId,
          location: fromBusinessLocation,
        }).session(session);

        const available = srcStock?.available_quantity || 0;
        if (available < requestedQty) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
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
          location: fromBusinessLocation,
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
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              "Lot math underflow"
            );
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
        }

        if (remaining > 0) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "FIFO allocation failed: not enough available lots."
          );
        }

        // 3) Update stocks summary (source & destination)
        // source: available_quantity -= requestedQty
        await StockModel.updateOne(
          { variant: variantId, location: fromBusinessLocation },
          {
            $inc: { available_quantity: -requestedQty },
            $set: { updatedAt: new Date() },
          },
          { session }
        );

        // destination: upsert & add, and retrieve the document
        const destStock = await StockModel.findOneAndUpdate(
          { variant: variantId, location: toBusinessLocation },
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
          await LotService.createLot(
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
              createdBy: transferData.transferBy as Types.ObjectId,
              status: "active",
            },
            session
          );
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
        transferBy: transferData.transferBy
          ? new Types.ObjectId(transferData.transferBy)
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

  async getStockByAProduct(slug: string): Promise<any> {
    const product = await ProductService.getBySlug(slug);
    const stock = await StockModel.find({ product: product?._id })
      .populate("location")
      .populate("variant")
      .lean();

    return { stock, product };
  }

  async getStockById(
    product_id: string,
    variant_id: string
  ): Promise<IStock | null> {
    const stock = await StockModel.findOne({
      product: product_id,
      variant: variant_id,
    })
      .populate("product")
      .populate("location")
      .populate("variant")
      .lean();

    return stock;
  }

  async updateStock(
    id: string,
    stockData: Partial<IStock>
  ): Promise<IStock | null> {
    const updatedStock = await StockModel.findByIdAndUpdate(id, stockData, {
      new: true,
      runValidators: true,
    })
      .populate("product")
      .populate("location")
      .populate("variant")
      .lean();

    return updatedStock;
  }

  async getAllStocks(
    options: IPaginationOptions,
    filterOptions: IStockFilters
  ) {
    const {
      location,
      product,
      variant,
      category,
      subcategory,
      sku,
      search_query,
      min_qty,
      max_qty,
    } = filterOptions;

    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const matchConditions: any = {};

    if (location) {
      if (!mongoose.isValidObjectId(location)) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid location");
      }
      matchConditions.location = new mongoose.Types.ObjectId(location);
    }

    if (product && mongoose.isValidObjectId(product)) {
      matchConditions.product = new mongoose.Types.ObjectId(product);
    }
    if (variant && mongoose.isValidObjectId(variant)) {
      matchConditions.variant = new mongoose.Types.ObjectId(variant);
    }
    if (min_qty !== undefined || max_qty !== undefined) {
      matchConditions.available_quantity = {};
      if (min_qty !== undefined)
        matchConditions.available_quantity.$gte = min_qty;
      if (max_qty !== undefined)
        matchConditions.available_quantity.$lte = max_qty;
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
      ...(category && mongoose.isValidObjectId(category)
        ? [
            {
              $match: {
                "product.category": new mongoose.Types.ObjectId(category),
              },
            },
          ]
        : []),

      ...(subcategory && mongoose.isValidObjectId(subcategory)
        ? [
            {
              $match: {
                "product.subcategory": new mongoose.Types.ObjectId(subcategory),
              },
            },
          ]
        : []),

      // --- SKU Filter ---
      ...(sku
        ? [{ $match: { "variant.sku": { $regex: sku, $options: "i" } } }]
        : []),

      // --- Search Query ---
      ...(search_query
        ? [
            {
              $match: {
                $or: [
                  { "product.name": { $regex: search_query, $options: "i" } },
                  { "variant.sku": { $regex: search_query, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },

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
    const result = await StockModel.findByIdAndDelete(id);
    if (!result) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Stock not found");
    }

    return true;
  }

  async getFullStockReport({ sku = "", page = 1, limit = 20 } = {}) {
    const stockQuery: any = {};

    if (sku) {
      // Join with product/variant to search by SKU
      const products = await ProductModel.find({
        sku: { $regex: sku, $options: "i" },
      })
        .select("_id")
        .lean();
      const variants = await VariantModel.find({
        sku: { $regex: sku, $options: "i" },
      })
        .select("_id")
        .lean();
      stockQuery.$or = [
        { product: { $in: products.map((p) => p._id) } },
        { variant: { $in: variants.map((v) => v._id) } },
      ];
    }

    const total = await StockModel.countDocuments(stockQuery);
    const stocks = await StockModel.find(stockQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product")
      .populate("variant")
      .populate("location")
      .lean();

    // For each stock, get all lots (not only active), all fields
    const report: any[] = [];
    for (const stock of stocks) {
      const lots = await LotModel.find({ stock: stock._id })
        .populate("createdBy", "name email")
        .lean();
      report.push({
        stock_id: stock._id,
        product: stock.product,
        variant: stock.variant,
        location: stock.location,
        available_quantity: stock.available_quantity,
        qty_reserved: stock.qty_reserved,
        total_sold: stock.total_sold,
        lots,
      });
    }

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: report,
    };
  }

  async getLowStockProducts({ threshold = 5, page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    // Aggregation pipeline: join product, variant, location and filter by threshold
    const pipeline = [
      {
        $match: {
          available_quantity: { $lte: threshold },
        },
      },
      // Join product
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      // Join variant
      {
        $lookup: {
          from: "variants",
          localField: "variant",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },
      // Join location
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
      // Count total for pagination meta
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ];

    const result = await StockModel.aggregate(pipeline);

    const data = result[0]?.data ?? [];
    const total = result[0]?.meta[0]?.total ?? 0;

    // Format response for each entry, include all fields
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const StockService = new Service();
