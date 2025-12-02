import mongoose, { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IBarcode } from "./barcode.interface";
import { VariantModel } from "../variant/variant.model";
import { BarcodeService } from "@/lib/barcode";
import { BarcodeModel } from "./barcode.model";
import { productBarcodeCondition, productBarcodeStatus } from "./barcode.enum";
import { IPurchase } from "../purchase/purchase.interface";
import { DefaultsPurchaseModel } from "../default-purchase/defult-purchase.model";
import { IDefaultsPurchase } from "../default-purchase/default-purchase.interface";
import { CounterModel } from "@/common/models/counter.model";
import { PurchaseModel } from "../purchase/purchase.model";
import { StockService } from "../stock/stock.service";
import { LotService } from "../lot/lot.service";
import { GlobalStockModel } from "../stock/globalStock.model";

class Service {
  async crateBarcodeForStock(
    sku: string,
    product_count: number,
    admin_note: string,
    user: unknown
  ): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const variant = await VariantModel.findOne({ sku }).session(session);
      if (!variant) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          "Variant not found for the provided SKU"
        );
      }

      const update_by = {
        name: (user as any).name || "System",
        role: (user as any).role || "System",
        date: new Date(),
        admin_note:
          admin_note ||
          `barcode initialized for stock by ${(user as any).name || "System"} and not assigned yet`,
        system_message: "Barcode created for stock initialization",
      };

      const doc: Partial<IBarcode>[] = [];
      for (let i = 0; i < product_count; i++) {
        const barcodeValue = BarcodeService.generateEAN13();
        doc.push({
          barcode: barcodeValue,
          sku: sku,
          variant: variant._id,
          product: variant.product,
          status: productBarcodeStatus.QC_PENDING,
          conditions: productBarcodeCondition.NEW,
          is_used_barcode: false,
          updated_logs: [update_by],
        });
      }
      await BarcodeModel.insertMany(doc, { session });
      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to create barcodes"
      );
    } finally {
      session.endSession();
    }
  }

  async updateBarcodeStatus(
    barcode: string,
    status: productBarcodeStatus,
    conditions: productBarcodeCondition,
    updated_by: { name: string; role: string; date: Date },
    admin_note?: string
  ): Promise<IBarcode | null> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const barcodeDoc = await BarcodeModel.findOne({ barcode }).session(
        session
      );
      if (!barcodeDoc) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Barcode not found");
      }

      const updateLog = {
        ...updated_by,
        admin_note: admin_note ?? undefined,
        system_message: `Status changed from ${barcodeDoc.status} to ${status} on ${new Date().toISOString()} and conditions set from ${barcodeDoc.conditions} to ${conditions}`,
      };

      if (!Array.isArray(barcodeDoc.updated_logs)) {
        barcodeDoc.updated_logs = [];
      }
      barcodeDoc.updated_logs.unshift(updateLog);

      barcodeDoc.status = status;
      barcodeDoc.conditions = conditions;

      await barcodeDoc.save({ session });

      await session.commitTransaction();

      return barcodeDoc as unknown as IBarcode;
    } catch (err) {
      // Abort transaction on error
      console.log(err, "update error");
      await session.abortTransaction();
      if (err instanceof ApiError) throw err;

      // Wrap other errors
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to update barcode status"
      );
    } finally {
      session.endSession();
    }
  }

  // async getBarcodesBySku(
  //   sku: string,
  //   barcode: string,
  //   options?: { page?: number; limit?: number; is_used_barcode?: boolean; status?: string, conditions?: string }
  // ): Promise<{
  //   barcode: IBarcode[];
  //   meta: { total: number; page: number; limit: number; totalPages: number };
  // }> {
  //   const page = Math.max(1, options?.page ?? 1);
  //   const limit = Math.max(1, options?.limit ?? 10);
  //   const skip = (page - 1) * limit;

  //   // Build dynamic match object — only add keys if value is provided (truthy)
  //   const match: Record<string, any> = {};
  //   if (sku) match.sku = sku;
  //   if (barcode) match.barcode = barcode;
  //   if (options && typeof options.is_used_barcode !== "undefined") {
  //     match.is_used_barcode = options.is_used_barcode;
  //   }

  //   // Aggregation pipeline with $facet to get total + paginated data in one query
  //   const pipeline: any[] = [
  //     { $match: match },
  //     { $sort: { createdAt: -1 } },
  //     {
  //       $facet: {
  //         metadata: [{ $count: "total" }],
  //         data: [{ $skip: skip }, { $limit: limit }],
  //       },
  //     },
  //     // Unwind metadata to make reading easier (optional but keeps shape consistent)
  //     {
  //       $unwind: {
  //         path: "$metadata",
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },
  //     {
  //       $project: {
  //         data: 1,
  //         total: { $ifNull: ["$metadata.total", 0] },
  //       },
  //     },
  //   ];

  //   const result = (await BarcodeModel.aggregate(pipeline).exec()) as Array<{
  //     data: IBarcode[];
  //     total: number;
  //   }>;

  //   const agg = result[0] ?? { data: [], total: 0 };

  //   const total = agg.total ?? 0;
  //   const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  //   return {
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       totalPages,
  //     },
  //     barcode: agg.data ?? [],
  //   };
  // }

  async getBarcodesBySku(
    sku: string,
    barcode: string,
    options?: {
      page?: number;
      limit?: number;
      is_used_barcode?: boolean;
      status?: string;
      conditions?: string;
    }
  ): Promise<{
    barcode: IBarcode[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.max(1, options?.limit ?? 10);
    const skip = (page - 1) * limit;

    // Build dynamic match object — only add keys if value is provided (non-empty)
    const match: Record<string, any> = {};
    if (sku) match.sku = sku;
    if (barcode) match.barcode = barcode;
    if (options && typeof options.is_used_barcode !== "undefined") {
      match.is_used_barcode = options.is_used_barcode;
    }
    if (options && options.status) {
      match.status = options.status;
    }
    if (options && options.conditions) {
      match.conditions = options.conditions;
    }

    // Collection name for Variant model (use actual model import in file)
    const variantColl = VariantModel.collection.name; // e.g. "variants"

    // Aggregation pipeline with $facet to get total + paginated data in one query
    // and $lookup inside the data facet to "populate" variant (projecting only required fields)
    const pipeline: any[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },

            // Populate variant via $lookup (only for paged results)
            {
              $lookup: {
                from: variantColl,
                let: { variantId: "$variant" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$variantId"] } } },
                  // project only needed fields from variant
                  {
                    $project: {
                      name: 1,
                      /* add more fields if needed */
                      image: 1,
                      regular_price: 1,
                      sale_price: 1,
                      attribute_values: 1,
                      attributes: 1,
                    },
                  },
                ],
                as: "variant",
              },
            },
            // unwind variant so each doc has variant object (or null)
            { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },

            // final projection for each document in data
            {
              $project: {
                barcode: 1,
                sku: 1,
                status: 1,
                conditions: 1,
                is_used_barcode: 1,
                updated_logs: 1,
                createdAt: 1,
                updatedAt: 1,
                variant: 1, // populated variant object
                product: 1, // leave as ObjectId or add lookup similarly if needed
                lot: 1,
                stock: 1,
              },
            },
          ],
        },
      },
      // Unwind metadata to make reading easier (optional but keeps shape consistent)
      {
        $unwind: {
          path: "$metadata",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          data: 1,
          total: { $ifNull: ["$metadata.total", 0] },
        },
      },
    ];

    const result = (await BarcodeModel.aggregate(pipeline).exec()) as Array<{
      data: IBarcode[];
      total: number;
    }>;

    const agg = result[0] ?? { data: [], total: 0 };

    const total = agg.total ?? 0;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      barcode: agg.data ?? [],
    };
  }

  async getBarcodeDetails(barcode: string): Promise<IBarcode | null> {
    const barcodeDetails = await BarcodeModel.findOne({ barcode })
      .populate("variant stock lot")
      .populate({
        path: "product",
        select: { name: 1, sku: 1, thumbnail: 1 }, // 1 = include
      });
    return barcodeDetails;
  }

  async checkBarcodeUsedOrNot(barcode: string): Promise<{
    is_used_barcode: boolean;
    status: productBarcodeStatus;
    conditions: productBarcodeCondition;
  }> {
    const barcodeDoc = await BarcodeModel.findOne({ barcode });
    if (!barcodeDoc) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Barcode not found");
    }

    const defualt_purchase = await DefaultsPurchaseModel.findOne({
      variant: barcodeDoc.variant,
    });

    if (!defualt_purchase) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `You cannot set defult purchase for this sku: ${barcodeDoc.sku} because its variant has no default purchase configured.`
      );
    }

    if (!defualt_purchase.unit_cost || !defualt_purchase.supplier) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `You cannot set defult purchase for this sku: ${barcodeDoc.sku} because its variant's default purchase is missing unit cost or supplier.`
      );
    }

    if (barcodeDoc.is_used_barcode) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Barcode has already been used an another product purchase"
      );
    }

    const result = {
      is_used_barcode: barcodeDoc.is_used_barcode || false,
      sku: barcodeDoc.sku,
      status: barcodeDoc.status as productBarcodeStatus,
      conditions: barcodeDoc.conditions as productBarcodeCondition,
    };

    return result;
  }

  // async createPurchaseFromBarcodes(
  //   barcodes: string[],
  //   location: Types.ObjectId,
  //   created_by: Types.ObjectId,
  //   received_by: Types.ObjectId,
  //   purchase_date: Date = new Date(),
  //   updated_by: { name: string; role: string; date: Date },
  //   admin_note?: string
  // ): Promise<{ purchase: IPurchase; updatedBarcodes: IBarcode[] }> {
  //   if (!Array.isArray(barcodes) || barcodes.length === 0) {
  //     throw new ApiError(
  //       HttpStatusCode.BAD_REQUEST,
  //       "barcodes must be a non-empty array"
  //     );
  //   }

  //   const session = await mongoose.startSession();
  //   session.startTransaction();
  //   try {
  //     // 1) Load barcode documents
  //     const barcodeDocs = await BarcodeModel.find({
  //       barcode: { $in: barcodes },
  //     })
  //       .session(session)
  //       .exec();

  //     if (barcodeDocs.length !== barcodes.length) {
  //       throw new ApiError(
  //         HttpStatusCode.NOT_FOUND,
  //         "One or more barcodes not found"
  //       );
  //     }

  //     // 2) Group by product+variant
  //     type GroupKey = string; // `${productId}|${variantId}`
  //     const groups = new Map<
  //       GroupKey,
  //       {
  //         product: Types.ObjectId;
  //         variant: Types.ObjectId;
  //         docs: IBarcode[];
  //         qty: number;
  //       }
  //     >();

  //     for (const doc of barcodeDocs) {
  //       const productId = (doc as any).product as Types.ObjectId;
  //       const variantId = (doc as any).variant as Types.ObjectId;
  //       const key = `${productId.toString()}|${variantId.toString()}`;
  //       if (!groups.has(key)) {
  //         groups.set(key, {
  //           product: productId,
  //           variant: variantId,
  //           docs: [],
  //           qty: 0,
  //         });
  //       }
  //       const g = groups.get(key)!;
  //       g.docs.push(doc);
  //       g.qty += 1;
  //     }

  //     // 3) Build purchase items from groups (items array in purchase)
  //     const items: any[] = []; // adapt to your purchaseItemSchema shape
  //     let subtotal = 0; // sum(unit_cost * qty) based on defaults

  //     // Collect supplier ids found in defaults to decide purchase.supplier
  //     const supplierSet = new Set<string>();

  //     // Use Array.from(groups.entries()) to avoid downlevelIteration error
  //     for (const [, grp] of Array.from(groups.entries())) {
  //       // fetch defaults for unit_cost (may be null)
  //       const defaults = (await DefaultsPurchaseModel.findOne({
  //         product: grp.product,
  //         variant: grp.variant,
  //       })
  //         .session(session)
  //         .lean()
  //         .exec()) as IDefaultsPurchase | null;

  //       const unit_cost = defaults ? defaults.unit_cost : 0;
  //       if (defaults && defaults.supplier) {
  //         supplierSet.add(String(defaults.supplier));
  //       }

  //       const itemTotal = unit_cost * grp.qty;
  //       subtotal += itemTotal;

  //       items.push({
  //         product: grp.product,
  //         variant: grp.variant,
  //         qty: grp.qty,
  //         unit_cost,
  //         discount: 0,
  //         tax: 0,
  //         lot_number: null,
  //         expiry_date: null,
  //         // add other fields your purchaseItemSchema expects as needed
  //       });
  //     }

  //     // No additional expenses in this flow; if required, accept as param and add.
  //     const totalExpenses = 0;
  //     const total_cost = subtotal + totalExpenses;

  //     // 4) Get atomic purchase_number via CounterModel (one counter per location)
  //     // CounterModel schema assumed: { _id: locationId (string/ObjectId), seq: Number }
  //     const counter = await CounterModel.findOneAndUpdate(
  //       { _id: location.toString() },
  //       { $inc: { seq: 1 } },
  //       { new: true, upsert: true, session }
  //     ).exec();

  //     const purchase_number =
  //       (counter as any)?.seq ?? (counter as any)?.sequence ?? 0;

  //     // Decide purchase.supplier:
  //     // - If exactly one distinct supplier found across groups, use it
  //     // - Otherwise leave undefined (or change policy if you want)
  //     let purchaseSupplier: Types.ObjectId | undefined = undefined;
  //     if (supplierSet.size === 1) {
  //       const [onlySupplier] = Array.from(supplierSet);
  //       purchaseSupplier = new Types.ObjectId(onlySupplier);
  //     } else {
  //       purchaseSupplier = undefined;
  //     }

  //     // 5) Pre-generate purchaseId and create Purchase document
  //     const purchaseId = new Types.ObjectId();
  //     const purchaseData: Partial<IPurchase> = {
  //       _id: purchaseId,
  //       created_by,
  //       received_by,
  //       received_at: purchase_date,
  //       location,
  //       purchase_number,
  //       purchase_date,
  //       supplier: purchaseSupplier ?? undefined,
  //       total_cost,
  //       items,
  //       expenses_applied: [],
  //       attachments: [],
  //       additional_note: "",
  //       status: undefined, // will default per schema
  //     };

  //     const purchase = (await new PurchaseModel(purchaseData).save({
  //       session,
  //     })) as IPurchase;

  //     // 6) For each group: upsert stock, create lot (pointing to purchaseId), update barcodes
  //     const updatedBarcodes: IBarcode[] = [];

  //     for (const [, grp] of Array.from(groups.entries())) {
  //       // get defaults again for supplier/unit_cost (we already fetched earlier; fetch again or cache)
  //       const defaults = (await DefaultsPurchaseModel.findOne({
  //         product: grp.product,
  //         variant: grp.variant,
  //       })
  //         .session(session)
  //         .lean()
  //         .exec()) as IDefaultsPurchase | null;

  //       const unit_cost = defaults ? defaults.unit_cost : 0;
  //       // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //       const supplier = defaults
  //         ? (defaults.supplier as Types.ObjectId | null)
  //         : null;

  //       // Upsert stock: StockService.findOneAndUpdateByPurchase must perform $inc upsert and return doc
  //       const stockQuery = {
  //         product: grp.product,
  //         variant: grp.variant,
  //         location,
  //       };

  //       const stock = await StockService.findOneAndUpdateByPurchase(
  //         stockQuery,
  //         {
  //           product: grp.product,
  //           variant: grp.variant,
  //           location,
  //           available_quantity: grp.qty,
  //           total_received: grp.qty,
  //         },
  //         session
  //       );

  //       if (!stock || !(stock as any)._id) {
  //         throw new ApiError(
  //           HttpStatusCode.INTERNAL_SERVER_ERROR,
  //           "Failed to create/update stock"
  //         );
  //       }

  //       // Create lot referencing this purchase
  //       const lot_number = `PUR-${purchase.purchase_number}-${String(grp.variant).slice(-4)}-${Date.now()}`;
  //       const lotData = {
  //         qty_available: grp.qty,
  //         cost_per_unit: unit_cost,
  //         received_at: purchase_date,
  //         createdBy: created_by,
  //         variant: grp.variant,
  //         product: grp.product,
  //         location,
  //         source: {
  //           type: "purchase" as const,
  //           ref_id: purchase._id,
  //         },
  //         lot_number,
  //         expiry_date: null,
  //         qty_total: grp.qty,
  //         qty_reserved: 0,
  //         status: "active" as any,
  //         notes: "",
  //         stock: stock._id,
  //       };

  //       const lot = await LotService.createLot(lotData, session);
  //       if (!lot || !(lot as any)._id) {
  //         throw new ApiError(
  //           HttpStatusCode.INTERNAL_SERVER_ERROR,
  //           "Failed to create lot"
  //         );
  //       }

  //       // Update each barcode in group: set lot, stock, is_used_barcode true, unshift updated_logs
  //       for (const doc of grp.docs) {
  //         const barcodeStr = String((doc as any).barcode);
  //         const prevStatus = (doc as any).status;
  //         const prevConditions = (doc as any).conditions;

  //         const updateLog = {
  //           ...updated_by,
  //           admin_note: admin_note ?? undefined,
  //           system_message: `Status changed to assigned on ${new Date().toISOString()}; assigned to lot ${lot._id} and stock ${stock._id}. Prev status: ${prevStatus}; prev conditions: ${prevConditions}`,
  //         };

  //         const updated = await BarcodeModel.findOneAndUpdate(
  //           { barcode: barcodeStr },
  //           {
  //             $set: {
  //               lot: lot._id,
  //               stock: stock._id,
  //               is_used_barcode: true,
  //               status: productBarcodeStatus.IN_STOCK,
  //               conditions: productBarcodeCondition.NEW,
  //             },
  //             $push: { updated_logs: { $each: [updateLog], $position: 0 } },
  //           },
  //           { new: true, session }
  //         ).exec();

  //         if (!updated) {
  //           throw new ApiError(
  //             HttpStatusCode.INTERNAL_SERVER_ERROR,
  //             `Failed to update barcode ${barcodeStr}`
  //           );
  //         }
  //         updatedBarcodes.push(updated as any);
  //       }
  //     }

  //     // 7) Commit transaction
  //     await session.commitTransaction();
  //     return { purchase, updatedBarcodes };
  //   } catch (err) {
  //     await session.abortTransaction();
  //     throw err;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async createPurchaseFromBarcodes(
    barcodes: string[],
    location: Types.ObjectId,
    created_by: Types.ObjectId,
    received_by: Types.ObjectId,
    purchase_date: Date = new Date(),
    updated_by: { name: string; role: string; date: Date },
    admin_note?: string
  ): Promise<{ purchase: IPurchase; updatedBarcodes: IBarcode[] }> {
    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "barcodes must be a non-empty array"
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1) Load barcode documents
      const barcodeDocs = await BarcodeModel.find({
        barcode: { $in: barcodes },
      })
        .session(session)
        .exec();

      if (barcodeDocs.length !== barcodes.length) {
        throw new ApiError(
          HttpStatusCode.NOT_FOUND,
          "One or more barcodes not found"
        );
      }

      // 2) Group by product+variant
      type GroupKey = string; // `${productId}|${variantId}`
      const groups = new Map<
        GroupKey,
        {
          product: Types.ObjectId;
          variant: Types.ObjectId;
          docs: IBarcode[];
          qty: number;
        }
      >();

      for (const doc of barcodeDocs) {
        const productId = (doc as any).product as Types.ObjectId;
        const variantId = (doc as any).variant as Types.ObjectId;
        const key = `${productId.toString()}|${variantId.toString()}`;
        if (!groups.has(key)) {
          groups.set(key, {
            product: productId,
            variant: variantId,
            docs: [],
            qty: 0,
          });
        }
        const g = groups.get(key)!;
        g.docs.push(doc);
        g.qty += 1;
      }

      // 3) Build purchase items from groups (items array in purchase)
      const items: any[] = []; // adapt to your purchaseItemSchema shape
      let subtotal = 0; // sum(unit_cost * qty) based on defaults

      // Collect supplier ids found in defaults to decide purchase.supplier
      const supplierSet = new Set<string>();

      // Use Array.from(groups.entries()) to avoid downlevelIteration error
      for (const [, grp] of Array.from(groups.entries())) {
        // fetch defaults for unit_cost (may be null)
        const defaults = (await DefaultsPurchaseModel.findOne({
          product: grp.product,
          variant: grp.variant,
        })
          .session(session)
          .lean()
          .exec()) as IDefaultsPurchase | null;

        const unit_cost = defaults ? defaults.unit_cost : 0;
        if (defaults && defaults.supplier) {
          supplierSet.add(String(defaults.supplier));
        }

        const itemTotal = unit_cost * grp.qty;
        subtotal += itemTotal;

        items.push({
          product: grp.product,
          variant: grp.variant,
          qty: grp.qty,
          unit_cost,
          discount: 0,
          tax: 0,
          lot_number: null,
          expiry_date: null,
          // add other fields your purchaseItemSchema expects as needed
        });
      }

      // No additional expenses in this flow; if required, accept as param and add.
      const totalExpenses = 0;
      const total_cost = subtotal + totalExpenses;

      // 4) Get atomic purchase_number via CounterModel (one counter per location)
      // CounterModel schema assumed: { _id: locationId (string/ObjectId), seq: Number }
      const counter = await CounterModel.findOneAndUpdate(
        { _id: location.toString() },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
      ).exec();

      const purchase_number =
        (counter as any)?.seq ?? (counter as any)?.sequence ?? 0;

      // Decide purchase.supplier:
      // - If exactly one distinct supplier found across groups, use it
      // - Otherwise leave undefined (or change policy if you want)
      let purchaseSupplier: Types.ObjectId | undefined = undefined;
      if (supplierSet.size === 1) {
        const [onlySupplier] = Array.from(supplierSet);
        purchaseSupplier = new Types.ObjectId(onlySupplier);
      } else {
        purchaseSupplier = undefined;
      }

      // 5) Pre-generate purchaseId and create Purchase document
      const purchaseId = new Types.ObjectId();
      const purchaseData: Partial<IPurchase> = {
        _id: purchaseId,
        created_by,
        received_by,
        received_at: purchase_date,
        location,
        purchase_number,
        purchase_date,
        supplier: purchaseSupplier ?? undefined,
        total_cost,
        items,
        expenses_applied: [],
        attachments: [],
        additional_note: "",
        status: undefined, // will default per schema
      };

      const purchase = (await new PurchaseModel(purchaseData).save({
        session,
      })) as IPurchase;

      // 6) For each group: upsert stock, create lot (pointing to purchaseId), update barcodes
      const updatedBarcodes: IBarcode[] = [];

      for (const [, grp] of Array.from(groups.entries())) {
        // get defaults again for supplier/unit_cost (we already fetched earlier; fetch again or cache)
        const defaults = (await DefaultsPurchaseModel.findOne({
          product: grp.product,
          variant: grp.variant,
        })
          .session(session)
          .lean()
          .exec()) as IDefaultsPurchase | null;

        const unit_cost = defaults ? defaults.unit_cost : 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const supplier = defaults
          ? (defaults.supplier as Types.ObjectId | null)
          : null;

        // Upsert stock: StockService.findOneAndUpdateByPurchase must perform $inc upsert and return doc data
        const stockQuery = {
          product: grp.product,
          variant: grp.variant,
          location,
        };

        const stock = await StockService.findOneAndUpdateByPurchase(
          stockQuery,
          {
            product: grp.product,
            variant: grp.variant,
            location,
            available_quantity: grp.qty,
            total_received: grp.qty,
          },
          session
        );

        if (!stock || !(stock as any)._id) {
          throw new ApiError(
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            "Failed to create/update stock"
          );
        }

        // ==========================================
        //  Update Global Stock Logic
        // ==========================================
        await GlobalStockModel.findOneAndUpdate(
          {
            product: grp.product,
            variant: grp.variant,
          },
          {
            $inc: {
              available_quantity: grp.qty,
              qty_total: grp.qty,
            },
            $setOnInsert: {
              qty_reserved: 0,
              total_sold: 0,
            },
          },
          {
            upsert: true,
            new: true,
            session,
          }
        );
        // ==========================================

        // Create lot referencing this purchase
        const lot_number = `PUR-${purchase.purchase_number}-${String(grp.variant).slice(-4)}-${Date.now()}`;
        const lotData = {
          qty_available: grp.qty,
          cost_per_unit: unit_cost,
          received_at: purchase_date,
          createdBy: created_by,
          variant: grp.variant,
          product: grp.product,
          location,
          source: {
            type: "purchase" as const,
            ref_id: purchase._id,
          },
          lot_number,
          expiry_date: null,
          qty_total: grp.qty,
          qty_reserved: 0,
          status: "active" as any,
          notes: "",
          stock: stock._id,
        };

        const lot = await LotService.createLot(lotData, session);
        if (!lot || !(lot as any)._id) {
          throw new ApiError(
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            "Failed to create lot"
          );
        }

        // Update each barcode in group: set lot, stock, is_used_barcode true, unshift updated_logs
        for (const doc of grp.docs) {
          const barcodeStr = String((doc as any).barcode);
          const prevStatus = (doc as any).status;
          const prevConditions = (doc as any).conditions;

          const updateLog = {
            ...updated_by,
            admin_note: admin_note ?? undefined,
            system_message: `Status changed to assigned on ${new Date().toISOString()}; assigned to lot ${lot._id} and stock ${stock._id}. Prev status: ${prevStatus}; prev conditions: ${prevConditions}`,
          };

          const updated = await BarcodeModel.findOneAndUpdate(
            { barcode: barcodeStr },
            {
              $set: {
                lot: lot._id,
                stock: stock._id,
                is_used_barcode: true,
                status: productBarcodeStatus.IN_STOCK,
                conditions: productBarcodeCondition.NEW,
              },
              $push: { updated_logs: { $each: [updateLog], $position: 0 } },
            },
            { new: true, session }
          ).exec();

          if (!updated) {
            throw new ApiError(
              HttpStatusCode.INTERNAL_SERVER_ERROR,
              `Failed to update barcode ${barcodeStr}`
            );
          }
          updatedBarcodes.push(updated as any);
        }
      }

      // 7) Commit transaction
      await session.commitTransaction();
      return { purchase, updatedBarcodes };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export const UniqueBarcodeService = new Service();
