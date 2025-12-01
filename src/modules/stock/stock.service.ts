import mongoose, { Types } from "mongoose";
import { StockModel } from "./stock.model";
import { IStock, IStockFilters, IStockReportQuery } from "./stock.interface";
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
import { AdjustedStocks } from "./adjustment.model";
import { IAdjustStocks } from "./adjusment.interface";

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

  async getFullStockReport({
    sku = "",
    threshold,
    page = 1,
    limit = 20,
  }: IStockReportQuery = {}) {
    const matchStage: any = {};

    // sku search — from product or variant
    if (sku) {
      const productIds = await ProductModel.find({
        sku: { $regex: sku, $options: "i" },
      })
        .select("_id")
        .lean();

      const variantIds = await VariantModel.find({
        sku: { $regex: sku, $options: "i" },
      })
        .select("_id")
        .lean();

      matchStage.$or = [
        { product: { $in: productIds.map((p) => p._id) } },
        { variant: { $in: variantIds.map((v) => v._id) } },
      ];
    }

    // threshold filter
    if (threshold && threshold > 0) {
      matchStage.available_quantity = { $lte: threshold };
    }

    // aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },

      // populate product
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

      // populate variant
      {
        $lookup: {
          from: "variants",
          localField: "variant",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },

      // populate location
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },

      // populate lots
      {
        $lookup: {
          from: "lots",
          localField: "_id",
          foreignField: "stock",
          as: "lots",
        },
      },

      // populate createdBy in lots
      {
        $lookup: {
          from: "users",
          localField: "lots.createdBy",
          foreignField: "_id",
          as: "createdByUsers",
        },
      },
      {
        $addFields: {
          lots: {
            $map: {
              input: "$lots",
              as: "lot",
              in: {
                $mergeObjects: [
                  "$$lot",
                  {
                    createdBy: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$createdByUsers",
                            as: "u",
                            cond: { $eq: ["$$u._id", "$$lot.createdBy"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unset: "createdByUsers" },

      // pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [data, totalCount] = await Promise.all([
      StockModel.aggregate(pipeline),
      StockModel.countDocuments(matchStage),
    ]);

    return {
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      data,
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  // stock adjustment log can be added here
  // async stocksAdjustment(payload: IAdjustStocks): Promise<IAdjustStocks> {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Pre-generate adjustmentId for use in movement refs
  //     const adjustmentId = new Types.ObjectId();

  //     // Initialize total_cost which will become total_amount
  //     let total_cost = 0;

  //     // Loop through each product in the adjustment payload
  //     for (const adjustItem of payload.products) {
  //       const sku = adjustItem.selected_variant.sku;
  //       const productId = adjustItem.product;
  //       const quantity = adjustItem.quantity;

  //       // console.log(barcode, "sku adjst")

  //       // Find variant by barcode (assuming unique)
  //       const variant = await VariantModel.findOne({sku: sku }).session(
  //         session
  //       );
  //       if (!variant) {
  //         throw new ApiError(, `Variant not found for sku ${sku}`);
  //       }
  //       const variantId = variant._id;

  //       // Find stock record
  //       const stock = await StockModel.findOne({
  //         product: productId,
  //         variant: variantId,
  //       }).session(session);

  //       if (!stock) {
  //         throw new ApiError(
  //           404,
  //           `Stock not found for product ${productId} and variant ${variantId}`
  //         );
  //       }

  //       let item_cost = 0;

  //       if (payload.action === "DEDUCTION") {
  //         // For DEDUCTION: Check sufficient stock
  //         if (stock.available_quantity < quantity) {
  //           throw new ApiError(
  //             400,
  //             `Insufficient stock for sku ${sku}. Available: ${stock?.available_quantity || 0}, Requested: ${quantity}`
  //           );
  //         }

  //         // Find active, non-expired lots sorted by received_at ascending (FIFO - oldest first)
  //         const lots = await LotModel.find({
  //           stock: stock._id,
  //           status: "active",
  //           qty_available: { $gt: 0 },
  //         })
  //           .sort({ received_at: 1 }) // 1 for ascending, FIFO
  //           .session(session);

  //         let remaining = quantity;

  //         // Process each lot in FIFO order
  //         for (const lot of lots) {
  //           if (remaining <= 0) break;
  //           const alloc = Math.min(remaining, lot.qty_available);
  //           item_cost += alloc * lot.cost_per_unit;

  //           // Update lot qty_available and status if depleted
  //           const update: any = {
  //             $inc: { qty_available: -alloc },
  //           };
  //           if (alloc === lot.qty_available) {
  //             update.status = "closed";
  //           }
  //           await LotModel.findByIdAndUpdate(lot._id, update, { session });

  //           // Create inventory movement for each allocation (negative qty for deduction)
  //           // await InventoryMovementModel.create(
  //           //   [
  //           //     {
  //           //       type: "adjustment",
  //           //       ref: adjustmentId, // Reference to the adjustment doc
  //           //       variant: variantId,
  //           //       product: productId,
  //           //       qty: -alloc, // Negative for deduction (out)
  //           //       cost_per_unit: lot.cost_per_unit,
  //           //       lot: lot._id, // Source lot
  //           //       note: `Adjustment Stock by ${payload.adjust_by}, action ${payload.action}, stock id ${adjustItem.stock}`,
  //           //     },
  //           //   ],
  //           //   { session }
  //           // );

  //           remaining -= alloc;
  //         }

  //         // If still remaining after all lots, throw error
  //         if (remaining > 0) {
  //           throw new ApiError(
  //             400,
  //             `Insufficient available lots for sku ${sku} despite stock record`
  //           );
  //         }

  //         // Update stock: reduce available_quantity and increase total_sold
  //         await StockModel.findByIdAndUpdate(
  //           stock._id,
  //           {
  //             $inc: {
  //               available_quantity: -quantity,
  //             },
  //           },
  //           { session }
  //         );

  //         // Calculate average unit_price and total_price for deduction (weighted average from lots)
  //         adjustItem.unit_price = item_cost / quantity;
  //         adjustItem.total_price = item_cost;
  //       } else if (payload.action === "ADDITION") {
  //         // For ADDITION: Find the last (newest) lot for this stock
  //         const lastLot = await LotModel.findOne({
  //           stock: stock._id,
  //         })
  //           .sort({ received_at: -1 }) // -1 for descending, newest first
  //           .session(session);

  //         if (!lastLot) {
  //           throw new ApiError(
  //             404,
  //             `No lots found for stock ${stock._id}. Cannot add without existing lot.`
  //           );
  //         }

  //         // If the last lot is closed, reopen it by setting status to active
  //         if (lastLot.status === "closed") {
  //           await LotModel.findByIdAndUpdate(
  //             lastLot._id,
  //             { status: "active" },
  //             { session }
  //           );
  //         }

  //         // Update the last lot: increase qty_available
  //         await LotModel.findByIdAndUpdate(
  //           lastLot._id,
  //           {
  //             $inc: { qty_available: quantity },
  //           },
  //           { session }
  //         );

  //         // Use the last lot's cost_per_unit for calculations (ignore payload unit_price)
  //         const cost_per_unit = lastLot.cost_per_unit;
  //         item_cost = quantity * cost_per_unit;

  //         // Set unit_price and total_price based on last lot
  //         adjustItem.unit_price = cost_per_unit;
  //         adjustItem.total_price = item_cost;

  //         // Create inventory movement for addition (positive qty)
  //         // await InventoryMovementModel.create(
  //         //   [
  //         //     {
  //         //       type: "adjustment",
  //         //       ref: adjustmentId,
  //         //       variant: variantId,
  //         //       product: productId,

  //         //       qty: quantity, // Positive for addition (in)
  //         //       cost_per_unit: cost_per_unit,
  //         //       lot: lastLot._id,
  //         //       note: `Adjustment Stock by ${payload.adjust_by}, action ${payload.action}, stock id ${adjustItem.stock}`,
  //         //     },
  //         //   ],
  //         //   { session }
  //         // );

  //         // Update stock: increase available_quantity (no total_sold for addition)
  //         await StockModel.findByIdAndUpdate(
  //           stock._id,
  //           {
  //             $inc: {
  //               available_quantity: quantity,
  //             },
  //           },
  //           { session }
  //         );
  //       } else {
  //         // Invalid action
  //         throw new ApiError(
  //           400,
  //           "Invalid action. Must be ADDITION or DEDUCTION"
  //         );
  //       }

  //       // Add item_cost to total_cost
  //       total_cost += item_cost;
  //     }

  //     // Set total_amount on payload
  //     payload.total_amount = total_cost;
  //     payload.activities_date = new Date();

  //     // Create the AdjustedStocks document with pre-generated _id
  //     const adjustmentDocs = await AdjustedStocks.create(
  //       [{ ...payload, _id: adjustmentId }],
  //       { session }
  //     );
  //     const adjustment = adjustmentDocs[0];

  //     // Commit transaction
  //     await session.commitTransaction();
  //     return adjustment;
  //   } catch (error: any) {
  //     await session.abortTransaction();
  //     throw new ApiError(
  //       error.statusCode,
  //       error?.message || "Server error during stock adjustment"
  //     );
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async stocksAdjustment(payload: IAdjustStocks): Promise<IAdjustStocks> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const adjustmentId = new Types.ObjectId();
      let total_cost = 0;

      for (const adjustItem of payload.products) {
        const barcode = adjustItem.selected_variant.sku;
        const productId = adjustItem.product;
        const quantity = adjustItem.quantity;

        const variant = await VariantModel.findOne({
          $or: [{ sku: barcode }, { barcode: barcode }],
        }).session(session);

        if (!variant) {
          throw new ApiError(
            404,
            `Variant not found for identifier ${barcode}`
          );
        }
        const variantId = variant._id;

        const stock = await StockModel.findOne({
          product: productId,
          variant: variantId,
        }).session(session);

        if (!stock) {
          throw new ApiError(
            404,
            `Stock not found for product ${productId} and variant ${variantId}`
          );
        }

        let item_cost = 0;

        if (payload.action === "DEDUCTION") {
          if (stock.available_quantity < quantity) {
            throw new ApiError(
              400,
              `Insufficient stock for identifier ${barcode}. Available: ${
                stock?.available_quantity || 0
              }, Requested: ${quantity}`
            );
          }

          const lots = await LotModel.find({
            stock: stock._id,
            status: "active",
            qty_available: { $gt: 0 },
          })
            .sort({ received_at: 1 })
            .session(session);

          let remaining = quantity;

          for (const lot of lots) {
            if (remaining <= 0) break;
            const alloc = Math.min(remaining, lot.qty_available);
            item_cost += alloc * lot.cost_per_unit;

            const update: any = {
              $inc: { qty_available: -alloc },
            };
            if (alloc === lot.qty_available) {
              update.status = "closed";
            }
            await LotModel.findByIdAndUpdate(lot._id, update, { session });

            remaining -= alloc;
          }

          if (remaining > 0) {
            throw new ApiError(
              400,
              `Insufficient available lots for identifier ${barcode} despite stock record`
            );
          }

          await StockModel.findByIdAndUpdate(
            stock._id,
            {
              $inc: {
                available_quantity: -quantity,
              },
            },
            { session }
          );

          adjustItem.unit_price = item_cost / quantity;
          adjustItem.total_price = item_cost;
        } else if (payload.action === "ADDITION") {
          const lastLot = await LotModel.findOne({
            stock: stock._id,
          })
            .sort({ received_at: -1 })
            .session(session);

          if (!lastLot) {
            throw new ApiError(
              404,
              `No lots found for stock ${stock._id}. Cannot add without existing lot.`
            );
          }

          if (lastLot.status === "closed") {
            await LotModel.findByIdAndUpdate(
              lastLot._id,
              { status: "active" },
              { session }
            );
          }

          await LotModel.findByIdAndUpdate(
            lastLot._id,
            {
              $inc: { qty_available: quantity },
            },
            { session }
          );

          const cost_per_unit = lastLot.cost_per_unit;
          item_cost = quantity * cost_per_unit;

          adjustItem.unit_price = cost_per_unit;
          adjustItem.total_price = item_cost;

          await StockModel.findByIdAndUpdate(
            stock._id,
            {
              $inc: {
                available_quantity: quantity,
              },
            },
            { session }
          );
        } else {
          throw new ApiError(
            400,
            "Invalid action. Must be ADDITION or DEDUCTION"
          );
        }

        total_cost += item_cost;
      }

      payload.total_amount = total_cost;
      payload.activities_date = new Date();

      const adjustmentDocs = await AdjustedStocks.create(
        [{ ...payload, _id: adjustmentId }],
        { session }
      );
      const adjustment = adjustmentDocs[0];

      await session.commitTransaction();
      return adjustment;
    } catch (error: any) {
      await session.abortTransaction();
      throw new ApiError(
        error.statusCode || 500,
        error?.message || "Server error during stock adjustment"
      );
    } finally {
      session.endSession();
    }
  }

  // async getAllStocksAdjustment(params: any) {
  //   const page = Math.max(1, params.page ?? 1);
  //   const limit = Math.max(1, Math.min(100, params.limit ?? 20));
  //   const skip = (page - 1) * limit;
  //   const sortBy = params.sortBy ?? "createdAt";
  //   const order = params.order === "asc" ? 1 : -1;
  //   const search =
  //     typeof params.search === "string" && params.search.trim().length > 0
  //       ? params.search.trim()
  //       : null;
  //   const filters = params.filters ?? {};

  //   // Base top-level match
  //   const matchTop: any = {};

  //   if (filters.business_location) {
  //     if (Types.ObjectId.isValid(filters.business_location))
  //       matchTop.business_location = new Types.ObjectId(
  //         filters.business_location
  //       );
  //   }
  //   if (filters.action) matchTop.action = filters.action;
  //   if (filters.adjust_by && Types.ObjectId.isValid(filters.adjust_by))
  //     matchTop.adjust_by = new Types.ObjectId(filters.adjust_by);

  //   if (filters.minTotalAmount != null || filters.maxTotalAmount != null) {
  //     matchTop.total_amount = {};
  //     if (filters.minTotalAmount != null)
  //       matchTop.total_amount.$gte = filters.minTotalAmount;
  //     if (filters.maxTotalAmount != null)
  //       matchTop.total_amount.$lte = filters.maxTotalAmount;
  //   }

  //   if (filters.startDate || filters.endDate) {
  //     matchTop.activities_date = {};
  //     if (filters.startDate)
  //       matchTop.activities_date.$gte = new Date(filters.startDate);
  //     if (filters.endDate)
  //       matchTop.activities_date.$lte = new Date(filters.endDate);
  //   }

  //   // Build product-level match that will be applied after unwind (if any product filters exist)
  //   const productFilters = filters.products ?? {};
  //   const productMatch: any = {};

  //   if (
  //     productFilters.product &&
  //     Types.ObjectId.isValid(productFilters.product)
  //   ) {
  //     productMatch["products.product"] = new Types.ObjectId(
  //       productFilters.product
  //     );
  //   }
  //   if (productFilters.stock && Types.ObjectId.isValid(productFilters.stock)) {
  //     productMatch["products.stock"] = new Types.ObjectId(productFilters.stock);
  //   }
  //   if (productFilters.sku) {
  //     productMatch["products.selected_variant.sku"] = {
  //       $regex: new RegExp(escapeRegex(productFilters.sku), "i"),
  //     };
  //   }
  //   if (productFilters.barcode) {
  //     productMatch["products.selected_variant.barcode"] = {
  //       $regex: new RegExp(escapeRegex(productFilters.barcode), "i"),
  //     };
  //   }
  //   if (
  //     productFilters.minQuantity != null ||
  //     productFilters.maxQuantity != null
  //   ) {
  //     productMatch["products.quantity"] = {};
  //     if (productFilters.minQuantity != null)
  //       productMatch["products.quantity"].$gte = productFilters.minQuantity;
  //     if (productFilters.maxQuantity != null)
  //       productMatch["products.quantity"].$lte = productFilters.maxQuantity;
  //   }
  //   if (
  //     productFilters.minUnitPrice != null ||
  //     productFilters.maxUnitPrice != null
  //   ) {
  //     productMatch["products.unit_price"] = {};
  //     if (productFilters.minUnitPrice != null)
  //       productMatch["products.unit_price"].$gte = productFilters.minUnitPrice;
  //     if (productFilters.maxUnitPrice != null)
  //       productMatch["products.unit_price"].$lte = productFilters.maxUnitPrice;
  //   }
  //   if (productFilters.product_note) {
  //     productMatch["products.product_note"] = {
  //       $regex: new RegExp(escapeRegex(productFilters.product_note), "i"),
  //     };
  //   }

  //   // attribute_values map filters (e.g. { Size: "M" })
  //   if (productFilters.attribute_values) {
  //     for (const [k, v] of Object.entries(productFilters.attribute_values)) {
  //       // attribute_values stored as Map -> key becomes a property
  //       productMatch[`products.selected_variant.attribute_values.${k}`] = {
  //         $regex: new RegExp(escapeRegex(v as string), "i"),
  //       };
  //     }
  //   }

  //   // Aggregation pipeline
  //   const pipeline: any[] = [];

  //   // initial top-level match
  //   pipeline.push({ $match: matchTop });

  //   // unwind products to enable product-level matching and lookups & searching across product name
  //   pipeline.push({
  //     $unwind: { path: "$products", preserveNullAndEmptyArrays: true }, // preserve docs with empty products
  //   });

  //   // If there are product-level filters, apply them now (matching at least one array element)
  //   if (Object.keys(productMatch).length > 0) {
  //     pipeline.push({ $match: productMatch });
  //   }

  //   // Lookup product document to get product name (useful for searching)
  //   pipeline.push({
  //     $lookup: {
  //       from: "products",
  //       localField: "products.product",
  //       foreignField: "_id",
  //       as: "products.product_doc",
  //     },
  //   });
  //   // product_doc is an array; unwind to get single doc (preserve if not found)
  //   pipeline.push({
  //     $unwind: {
  //       path: "$products.product_doc",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   });
  //   // --- Populate business_location ---

  //   // --- Populate adjust_by ---
  //   pipeline.push({
  //     $lookup: {
  //       from: "users",
  //       localField: "adjust_by",
  //       foreignField: "_id",
  //       as: "adjust_by",
  //     },
  //   });
  //   pipeline.push({
  //     $unwind: { path: "$adjust_by", preserveNullAndEmptyArrays: true },
  //   });

  //   // ... the rest of the pipeline (product, variant, etc.)
  //   // Build a searchable combined field (concatenate several fields)
  //   const searchableFields = [
  //     { $ifNull: ["$note", ""] },
  //     { $ifNull: ["$products.product_doc.name", ""] },
  //     { $ifNull: ["$products.selected_variant.sku", ""] },
  //     { $ifNull: ["$products.selected_variant.barcode", ""] },
  //     { $ifNull: ["$products.product_note", ""] },
  //   ];

  //   pipeline.push({
  //     $addFields: {
  //       __searchable: {
  //         $trim: {
  //           input: {
  //             $reduce: {
  //               input: searchableFields,
  //               initialValue: "",
  //               in: { $concat: ["$$value", " ", "$$this"] },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   // If `search` is provided, apply it (case-insensitive regex on the combined field)
  //   if (search) {
  //     const regex = new RegExp(escapeRegex(search), "i");
  //     pipeline.push({
  //       $match: {
  //         __searchable: { $regex: regex },
  //       },
  //     });
  //   }

  //   // Re-group back to original document shape: collect products back into array
  //   pipeline.push({
  //     $group: {
  //       _id: "$_id",
  //       doc: { $first: "$$ROOT" },
  //       products: {
  //         $push: {
  //           $cond: [{ $ne: ["$products", null] }, "$products", "$$REMOVE"],
  //         },
  //       },
  //     },
  //   });

  //   // Replace doc.products with reconstructed array and remove helper fields
  //   pipeline.push({
  //     $addFields: {
  //       "doc.products": {
  //         $cond: [
  //           {
  //             $and: [
  //               { $isArray: "$products" },
  //               { $gt: [{ $size: "$products" }, 0] },
  //             ],
  //           },
  //           "$products",
  //           [],
  //         ],
  //       },
  //     },
  //   });

  //   // Project final document
  //   pipeline.push({
  //     $replaceRoot: { newRoot: "$doc" },
  //   });

  //   // Shape the output to the desired structure
  //   pipeline.push({
  //     $project: {
  //       _id: 1,
  //       business_location: {
  //         _id: 1,
  //         name: 1,
  //         address: {
  //           division: 1,
  //           district: 1,
  //           thana: 1,
  //           local_address: 1,
  //         },
  //         type: 1,
  //       },
  //       products: {
  //         $map: {
  //           input: "$products",
  //           as: "prod",
  //           in: {
  //             product: {
  //               _id: "$$prod.product",
  //               name: "$$prod.product_doc.name",
  //               thumbnail: "$$prod.product_doc.thumbnail",
  //               sku: "$$prod.product_doc.sku",
  //             },
  //             quantity: "$$prod.quantity",
  //             selected_variant: {
  //               attribute_values: "$$prod.selected_variant.attribute_values",
  //               sku: "$$prod.selected_variant.sku",
  //               image: "$$prod.selected_variant.image",
  //               regular_price: "$$prod.selected_variant.regular_price",
  //               sale_price: "$$prod.selected_variant.sale_price",
  //               barcode: "$$prod.selected_variant.barcode",
  //             },
  //             unit_price: "$$prod.unit_price",
  //             total_price: "$$prod.total_price",
  //             product_note: "$$prod.product_note",
  //             stock: "$$prod.stock",
  //             _id: "$$prod._id",
  //           },
  //         },
  //       },
  //       note: 1,
  //       action: 1,
  //       total_amount: 1,
  //       adjust_by: {
  //         _id: 1,
  //         phone_number: 1,
  //         full_name: 1,
  //         role: 1,
  //       },
  //       activities_date: 1,
  //       createdAt: 1,
  //       updatedAt: 1,
  //     },
  //   });

  //   // Facet to get total count and paginated results
  //   pipeline.push({
  //     $facet: {
  //       meta: [{ $count: "total" }],
  //       data: [
  //         { $sort: { [sortBy]: order, _id: 1 } },
  //         { $skip: skip },
  //         { $limit: limit },
  //       ],
  //     },
  //   });

  //   // Execute aggregation
  //   const result = await AdjustedStocks.aggregate(pipeline).exec();

  //   const meta = result[0]?.meta?.[0] ?? { total: 0 };
  //   const docs = result[0]?.data ?? [];

  //   const total = meta.total ?? 0;
  //   const pages = Math.max(1, Math.ceil(total / limit));

  //   return {
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       pages,
  //     },
  //     data: docs,
  //   };
  // }

  async getAllStocksAdjustment(params: any) {
    const pageInput = Number(params.page);
    const limitInput = Number(params.limit);

    const page = Math.max(1, !isNaN(pageInput) ? pageInput : 1);
    const limit = Math.max(
      1,
      Math.min(100, !isNaN(limitInput) ? limitInput : 20)
    );

    const skip = (page - 1) * limit;
    const sortBy = params.sortBy ?? "createdAt";
    const order = params.order === "asc" ? 1 : -1;
    const search =
      typeof params.search === "string" && params.search.trim().length > 0
        ? params.search.trim()
        : null;
    const filters = params.filters ?? {};

    const matchTop: any = {};

    if (filters.action) matchTop.action = filters.action;
    if (filters.adjust_by && Types.ObjectId.isValid(filters.adjust_by))
      matchTop.adjust_by = new Types.ObjectId(filters.adjust_by);

    if (filters.minTotalAmount != null || filters.maxTotalAmount != null) {
      matchTop.total_amount = {};
      if (filters.minTotalAmount != null)
        matchTop.total_amount.$gte = Number(filters.minTotalAmount);
      if (filters.maxTotalAmount != null)
        matchTop.total_amount.$lte = Number(filters.maxTotalAmount);
    }

    if (filters.startDate || filters.endDate) {
      matchTop.activities_date = {};
      if (filters.startDate)
        matchTop.activities_date.$gte = new Date(filters.startDate);
      if (filters.endDate)
        matchTop.activities_date.$lte = new Date(filters.endDate);
    }

    const productFilters = filters.products ?? {};
    const productMatch: any = {};

    if (
      productFilters.product &&
      Types.ObjectId.isValid(productFilters.product)
    ) {
      productMatch["products.product"] = new Types.ObjectId(
        productFilters.product
      );
    }
    if (productFilters.sku) {
      productMatch["products.selected_variant.sku"] = {
        $regex: new RegExp(
          productFilters.sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        ),
      };
    }
    if (productFilters.barcode) {
      productMatch["products.selected_variant.barcode"] = {
        $regex: new RegExp(
          productFilters.barcode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        ),
      };
    }
    if (
      productFilters.minQuantity != null ||
      productFilters.maxQuantity != null
    ) {
      productMatch["products.quantity"] = {};
      if (productFilters.minQuantity != null)
        productMatch["products.quantity"].$gte = Number(
          productFilters.minQuantity
        );
      if (productFilters.maxQuantity != null)
        productMatch["products.quantity"].$lte = Number(
          productFilters.maxQuantity
        );
    }
    if (
      productFilters.minUnitPrice != null ||
      productFilters.maxUnitPrice != null
    ) {
      productMatch["products.unit_price"] = {};
      if (productFilters.minUnitPrice != null)
        productMatch["products.unit_price"].$gte = Number(
          productFilters.minUnitPrice
        );
      if (productFilters.maxUnitPrice != null)
        productMatch["products.unit_price"].$lte = Number(
          productFilters.maxUnitPrice
        );
    }

    if (productFilters.attribute_values) {
      for (const [k, v] of Object.entries(productFilters.attribute_values)) {
        productMatch[`products.selected_variant.attribute_values.${k}`] = {
          $regex: new RegExp(
            (v as string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
          ),
        };
      }
    }

    const pipeline: any[] = [];

    pipeline.push({ $match: matchTop });

    pipeline.push({
      $unwind: { path: "$products", preserveNullAndEmptyArrays: true },
    });

    if (Object.keys(productMatch).length > 0) {
      pipeline.push({ $match: productMatch });
    }

    pipeline.push({
      $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "_id",
        as: "products.product_doc",
      },
    });

    pipeline.push({
      $unwind: {
        path: "$products.product_doc",
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "adjust_by",
        foreignField: "_id",
        as: "adjust_by",
      },
    });

    pipeline.push({
      $unwind: { path: "$adjust_by", preserveNullAndEmptyArrays: true },
    });

    const searchableFields = [
      { $ifNull: ["$notes", ""] },
      { $ifNull: ["$reason", ""] },
      { $ifNull: ["$products.product_doc.name", ""] },
      { $ifNull: ["$products.selected_variant.sku", ""] },
      { $ifNull: ["$products.selected_variant.barcode", ""] },
    ];

    pipeline.push({
      $addFields: {
        __searchable: {
          $trim: {
            input: {
              $reduce: {
                input: searchableFields,
                initialValue: "",
                in: { $concat: ["$$value", " ", "$$this"] },
              },
            },
          },
        },
      },
    });

    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      pipeline.push({
        $match: {
          __searchable: { $regex: regex },
        },
      });
    }

    pipeline.push({
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        products: {
          $push: {
            $cond: [{ $ne: ["$products", null] }, "$products", "$$REMOVE"],
          },
        },
      },
    });

    pipeline.push({
      $addFields: {
        "doc.products": {
          $cond: [
            {
              $and: [
                { $isArray: "$products" },
                { $gt: [{ $size: "$products" }, 0] },
              ],
            },
            "$products",
            [],
          ],
        },
      },
    });

    pipeline.push({
      $replaceRoot: { newRoot: "$doc" },
    });

    pipeline.push({
      $project: {
        _id: 1,
        products: {
          $map: {
            input: "$products",
            as: "prod",
            in: {
              product: {
                _id: "$$prod.product",
                name: "$$prod.product_doc.name",
                thumbnail: "$$prod.product_doc.thumbnail",
                sku: "$$prod.product_doc.sku",
              },
              quantity: "$$prod.quantity",
              selected_variant: {
                sku: "$$prod.selected_variant.sku",
                attribute_values: "$$prod.selected_variant.attribute_values",
                image: "$$prod.selected_variant.image",
                regular_price: "$$prod.selected_variant.regular_price",
                sale_price: "$$prod.selected_variant.sale_price",
                barcode: "$$prod.selected_variant.barcode",
              },
              unit_price: "$$prod.unit_price",
              total_price: "$$prod.total_price",
              _id: "$$prod._id",
            },
          },
        },
        notes: 1,
        reason: 1,
        action: 1,
        total_amount: 1,
        adjust_by: {
          _id: 1,
          full_name: 1,
          phone_number: 1,
          role: 1,
        },
        activities_date: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    pipeline.push({
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $sort: { [sortBy]: order, _id: 1 } },
          { $skip: skip },
          { $limit: limit },
        ],
      },
    });

    const result = await AdjustedStocks.aggregate(pipeline).exec();

    const meta = result[0]?.meta?.[0] ?? { total: 0 };
    const docs = result[0]?.data ?? [];

    const total = meta.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      meta: {
        total,
        page,
        limit,
        pages,
      },
      data: docs,
    };
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const StockService = new Service();
