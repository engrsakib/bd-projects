import mongoose, { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IBarcode } from "./barcode.interface";
import { VariantModel } from "../variant/variant.model";
import { BarcodeService } from "@/lib/barcode";
import { BarcodeModel } from "./barcode.model";
import {
  checkFor,
  productBarcodeCondition,
  productBarcodeStatus,
} from "./barcode.enum";
import { IPurchase } from "../purchase/purchase.interface";
import { DefaultsPurchaseModel } from "../default-purchase/defult-purchase.model";
import { IDefaultsPurchase } from "../default-purchase/default-purchase.interface";
import { CounterModel } from "@/common/models/counter.model";
import { PurchaseModel } from "../purchase/purchase.model";
import { StockService } from "../stock/stock.service";
import { LotService } from "../lot/lot.service";
import { GlobalStockModel } from "../stock/globalStock.model";
import { OrderModel } from "../order/order.model";
import { StockModel } from "../stock/stock.model";
import { LotModel } from "../lot/lot.model";
import { ORDER_STATUS } from "../order/order.enums";

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
        system_message: `Status changed from ${barcodeDoc.status} to ${status ? status : barcodeDoc.status} on ${new Date().toISOString()} and conditions set from ${barcodeDoc.conditions} to ${conditions ? conditions : barcodeDoc.conditions}`,
      };

      if (!Array.isArray(barcodeDoc.updated_logs)) {
        barcodeDoc.updated_logs = [];
      }
      barcodeDoc.updated_logs.unshift(updateLog);

      barcodeDoc.status = status ? status : barcodeDoc.status;
      barcodeDoc.conditions = conditions ? conditions : barcodeDoc.conditions;

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

  async checkIsBarcodeExistsAndReadyForUse(
    orderId: number | string,
    barcode: string,
    check_for: string
  ): Promise<{
    is_used_barcode: boolean;
    status: productBarcodeStatus;
    conditions: productBarcodeCondition;
    barcode: string;
    sku: string;
  }> {
    if (!barcode || typeof barcode !== "string") {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "barcode is required");
    }

    const barcodeDoc = await BarcodeModel.findOne({ barcode })
      .populate("variant")
      .lean()
      .exec();

    if (!barcodeDoc) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Barcode not found");
    }

    if (
      check_for === checkFor.ASSIGEN &&
      barcodeDoc.status !== productBarcodeStatus.IN_STOCK
    ) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Barcode status is ${barcodeDoc.status}, not ready for use`
      );
    }

    console.log(check_for, "check for");

    if (
      check_for === checkFor.RETURNED &&
      barcodeDoc.status !== productBarcodeStatus.ASSIGNED
    ) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Barcode status is ${barcodeDoc.status}, not ready for returning`
      );
    }

    const order = await OrderModel.findOne({ order_id: orderId })
      .populate({
        path: "items.variant",
        select: "sku",
      })
      .lean()
      .exec();

    if (!order) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
    }

    const targetSku = (barcodeDoc as IBarcode)?.sku;
    // console.log(targetSku,"sku data from barcode");
    const targetProductId = String(barcodeDoc.product);

    const matchesOrderItem = (order.items || []).some((item: any) => {
      const isProductMatch = String(item.product) === targetProductId;

      const itemSku = item.variant?.sku;
      // console.log(itemSku, "sku data from order item");
      const isSkuMatch = itemSku === targetSku;

      // console.log(isSkuMatch,"sku match")

      // গ. কোয়ান্টিটি চেক (আর কতগুলো বাকি আছে)
      // const alreadyAssigned = Array.isArray(item.barcode)
      //   ? item.barcode.length
      //   : 0;
      // const needsMore =
      //   typeof item.quantity === "number"
      //     ? alreadyAssigned < item.quantity
      //     : true;

      // console.log(isProductMatch,  isSkuMatch, needsMore, "final match result");

      // সব শর্ত সত্য হতে হবে
      return isProductMatch && isSkuMatch;
    });

    if (!matchesOrderItem) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Barcode (${barcode}) SKU: '${targetSku}' does not match any pending item in this order.`
      );
    }

    // ৬. সফল হলে রিটার্ন করা
    return {
      is_used_barcode: Boolean(barcodeDoc.is_used_barcode),
      status: barcodeDoc.status as productBarcodeStatus,
      conditions: barcodeDoc.conditions as productBarcodeCondition,
      barcode: barcodeDoc.barcode,
      sku: targetSku,
    };
  }

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

  async processOrderBarcodes(
    orderId: string,
    barcodes: string[],
    updatedBy: { name: string; role: string; date: Date }
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate & dedupe input barcodes
      if (!Array.isArray(barcodes) || barcodes.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "barcodes array is required"
        );
      }
      // Check duplicates in input explicitly (fail fast)
      const uniqSet = new Set(barcodes);
      if (uniqSet.size !== barcodes.length) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Duplicate barcodes provided in input"
        );
      }
      const uniqBarcodes = Array.from(uniqSet);

      // 1. Fetch Order
      const order = await OrderModel.findOne({ order_id: orderId }).session(
        session
      );

      if (!order) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
      }

      // 2. Fetch Barcodes (initial read to get product/variant/stock/lot info)
      const barcodeDocs = await BarcodeModel.find({
        barcode: { $in: uniqBarcodes },
      })
        .session(session)
        .exec();

      if (barcodeDocs.length !== uniqBarcodes.length) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Duplicate barcodes provided in input"
        );
      }

      // 3. Validate initial state quickly (optional) but final claim is done atomically below.
      for (const doc of barcodeDocs) {
        if (!doc.is_used_barcode) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Barcode ${doc.barcode} - sku ${doc.sku} is not assigned for any product yet`
          );
        }
        // We allow status check but claim will enforce it atomically
        if (doc.status !== productBarcodeStatus.IN_STOCK) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Barcode ${doc.barcode} - sku ${doc.sku} is not in stock (status: ${doc.status})`
          );
        }
      }

      // 4. Group barcodes by Variant (product+variant) for order mapping and stock/lot batching
      const groups = new Map<
        string,
        {
          product: Types.ObjectId;
          variant: Types.ObjectId;
          barcodes: string[];
          docs: typeof barcodeDocs;
        }
      >();

      for (const doc of barcodeDocs) {
        const key = `${doc.product.toString()}_${doc.variant.toString()}`;
        if (!groups.has(key)) {
          groups.set(key, {
            product: doc.product as Types.ObjectId,
            variant: doc.variant as Types.ObjectId,
            barcodes: [],
            docs: [],
          });
        }
        const group = groups.get(key)!;
        group.barcodes.push(doc.barcode);
        group.docs.push(doc);
      }

      // 5. For each group: claim barcodes atomically, then update stocks/lots/global stock, and update order item
      for (const [, group] of Array.from(groups.entries())) {
        const qty = group.barcodes.length;

        if (qty === 0) {
          continue; // skip empty groups (should not happen)
        }

        // A. Find matching order item
        const orderItem = (order.items ?? []).find(
          (item) =>
            item.product.toString() === group.product.toString() &&
            item.variant.toString() === group.variant.toString()
        );

        if (!orderItem) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `The order doesn’t include any item with the specified barcode ${group.barcodes.join(", ")} sku ${group.docs[0]?.sku}. Product ID: ${group.product}, Variant ID: ${group.variant}`
          );
        }

        // Ensure not exceeding ordered quantity
        const alreadyAssigned = Array.isArray(orderItem.barcode)
          ? orderItem.barcode.length
          : 0;
        if (alreadyAssigned + qty > orderItem.quantity) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Too many barcodes for item ${group.product}. Ordered: ${orderItem.quantity}, Already Assigned: ${alreadyAssigned}, New: ${qty}`
          );
        }

        // B. Atomically claim each barcode (ensures no race with other processes)
        // Use per-barcode findOneAndUpdate with precondition { status: IN_STOCK, is_used_barcode: false }
        const claimedDocs: Array<(typeof barcodeDocs)[number]> = [];
        for (const doc of group.docs) {
          const prevStatus = doc.status;
          const prevConditions = (doc as any).conditions;
          const updateLog = {
            name: updatedBy.name,
            role: updatedBy.role,
            date: updatedBy.date,
            system_message: `Assigned to Order #${order.order_id} on ${new Date().toISOString()}; Prev status: ${prevStatus}; Prev conditions: ${prevConditions}`,
          };

          const claimed = await BarcodeModel.findOneAndUpdate(
            {
              barcode: doc.barcode,
              status: productBarcodeStatus.IN_STOCK,
              is_used_barcode: true,
            },
            {
              $set: {
                status: productBarcodeStatus.ASSIGNED,
                is_used_barcode: true,
              },
              $push: { updated_logs: { $each: [updateLog], $position: 0 } },
            },
            { session, new: true }
          ).exec();

          if (!claimed) {
            // If any barcode cannot be claimed atomically, abort overall operation
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Failed to claim barcode ${doc.barcode} (may be already assigned or out of stock)`
            );
          }
          claimedDocs.push(claimed);
        }

        // C. Update Order item in-memory (we'll save order at the end of group processing)
        orderItem.barcode = orderItem.barcode ?? [];
        orderItem.barcode.push(...group.barcodes);

        // D. Aggregate stock and lot counts from claimed docs
        const stockMap = new Map<string, number>();
        const lotMap = new Map<string, number>();
        for (const d of claimedDocs) {
          if (d.stock) {
            const sId = d.stock.toString();
            stockMap.set(sId, (stockMap.get(sId) || 0) + 1);
          }
          if (d.lot) {
            const lId = d.lot.toString();
            lotMap.set(lId, (lotMap.get(lId) || 0) + 1);
          }
        }

        // E. Decrease Stock Available Quantity atomically with precondition (no negative)
        for (const [stockId, count] of Array.from(stockMap.entries())) {
          const updatedStock = await StockModel.findOneAndUpdate(
            { _id: stockId, available_quantity: { $gte: count } },
            { $inc: { available_quantity: -count } },
            { session, new: true }
          ).exec();

          if (!updatedStock) {
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Insufficient stock for stockId ${stockId} while fulfilling order`
            );
          }
        }

        // F. Decrease Lot qty_available atomically and set status to 'closed' if becomes zero
        for (const [lotId, count] of Array.from(lotMap.entries())) {
          const updatedLot = await LotModel.findOneAndUpdate(
            { _id: lotId, qty_available: { $gte: count } },
            { $inc: { qty_available: -count } },
            { session, new: true }
          ).exec();

          if (!updatedLot) {
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Insufficient lot quantity for lot ${lotId}`
            );
          }

          // If after decrement qty_available is 0, set status closed
          if ((updatedLot.qty_available ?? 0) === 0) {
            await LotModel.findByIdAndUpdate(
              lotId,
              { $set: { status: "closed" } },
              { session }
            );
          }
        }

        // G. Update Global Stock (reduce qty_reserved)
        await GlobalStockModel.findOneAndUpdate(
          { product: group.product, variant: group.variant },
          { $inc: { qty_reserved: -qty } },
          { session }
        );
      }
      order.is_assigned_product_scan = true;
      // 6. Save Order (all item barcode arrays updated in-memory)
      await order.save({ session });

      await session.commitTransaction();
      return { success: true, message: "Barcodes assigned successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async processReturnBarcodes(
    orderId: string,
    barcodes: string[],
    updatedBy: { name: string; role: string; date: Date }
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate & dedupe input barcodes
      if (!Array.isArray(barcodes) || barcodes.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "barcodes array is required"
        );
      }
      // Check duplicates in input explicitly (fail fast)
      const uniqSet = new Set(barcodes);
      if (uniqSet.size !== barcodes.length) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Duplicate barcodes provided in input"
        );
      }
      const uniqBarcodes = Array.from(uniqSet);
      let allItemsCounted = 0;

      // 1. Fetch Order
      const order = await OrderModel.findOne({ order_id: orderId }).session(
        session
      );

      if (!order) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Order not found");
      }

      if (order.items) {
        allItemsCounted = order.items.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );
      }

      // 2. Fetch Barcodes (initial read to get product/variant/stock/lot info)
      const barcodeDocs = await BarcodeModel.find({
        barcode: { $in: uniqBarcodes },
      })
        .session(session)
        .exec();

      if (barcodeDocs.length !== uniqBarcodes.length) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Duplicate barcodes provided in input"
        );
      }

      // 3. Validate initial state quickly (optional) but final claim is done atomically below.
      for (const doc of barcodeDocs) {
        if (!doc.is_used_barcode) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Barcode ${doc.barcode} - sku ${doc.sku} is not assigned for any product yet`
          );
        }
        // We allow status check but claim will enforce it atomically
        if (doc.status !== productBarcodeStatus.ASSIGNED) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `Barcode ${doc.barcode} - sku ${doc.sku} is not assigned (status: ${doc.status})`
          );
        }
      }

      // 4. Group barcodes by Variant (product+variant) for order mapping and stock/lot batching
      const groups = new Map<
        string,
        {
          product: Types.ObjectId;
          variant: Types.ObjectId;
          barcodes: string[];
          docs: typeof barcodeDocs;
        }
      >();

      for (const doc of barcodeDocs) {
        const key = `${doc.product.toString()}_${doc.variant.toString()}`;
        if (!groups.has(key)) {
          groups.set(key, {
            product: doc.product as Types.ObjectId,
            variant: doc.variant as Types.ObjectId,
            barcodes: [],
            docs: [],
          });
        }
        const group = groups.get(key)!;
        group.barcodes.push(doc.barcode);
        group.docs.push(doc);
      }

      // 5. For each group: claim barcodes atomically, then update stocks/lots/global stock, and update order item
      for (const [, group] of Array.from(groups.entries())) {
        const qty = group.barcodes.length;

        if (qty === 0) {
          continue; // skip empty groups (should not happen)
        }

        // A. Find matching order item
        const orderItem = (order.items ?? []).find(
          (item) =>
            item.product.toString() === group.product.toString() &&
            item.variant.toString() === group.variant.toString()
        );

        if (!orderItem) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            `The order doesn’t include any item with the specified barcode ${group.barcodes.join(", ")} sku ${group.docs[0]?.sku}. Product ID: ${group.product}, Variant ID: ${group.variant}`
          );
        }

        // Ensure not exceeding ordered quantity
        // const alreadyAssigned = Array.isArray(orderItem.barcode)
        //   ? orderItem.barcode.length
        //   : 0;
        // if (alreadyAssigned + qty > orderItem.quantity) {
        //   throw new ApiError(
        //     HttpStatusCode.BAD_REQUEST,
        //     `Too many barcodes for item ${group.product}. Ordered: ${orderItem.quantity}, Already Assigned: ${alreadyAssigned}, New: ${qty}`
        //   );
        // }

        // B. Atomically claim each barcode (ensures no race with other processes)
        // Use per-barcode findOneAndUpdate with precondition { status: IN_STOCK, is_used_barcode: false }
        const claimedDocs: Array<(typeof barcodeDocs)[number]> = [];
        for (const doc of group.docs) {
          const prevStatus = doc.status;
          const prevConditions = (doc as any).conditions;
          const updateLog = {
            name: updatedBy.name,
            role: updatedBy.role,
            date: updatedBy.date,
            system_message: `Returned Order #${order.order_id} on ${new Date().toISOString()}; Prev status: ${prevStatus}; Prev conditions: ${prevConditions}`,
          };

          const claimed = await BarcodeModel.findOneAndUpdate(
            {
              barcode: doc.barcode,
              status: productBarcodeStatus.ASSIGNED,
              is_used_barcode: true,
            },
            {
              $set: {
                status: productBarcodeStatus.IN_STOCK,
                is_used_barcode: true,
              },
              $push: { updated_logs: { $each: [updateLog], $position: 0 } },
            },
            { session, new: true }
          ).exec();

          if (!claimed) {
            // If any barcode cannot be claimed atomically, abort overall operation
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Failed to claim barcode ${doc.barcode} (may be already assigned or out of stock)`
            );
          }
          claimedDocs.push(claimed);
        }

        // C. Update Order item in-memory (we'll save order at the end of group processing)
        orderItem.barcode = orderItem.barcode ?? [];
        orderItem.barcode.push(...group.barcodes);

        // D. Aggregate stock and lot counts from claimed docs
        const stockMap = new Map<string, number>();
        const lotMap = new Map<string, number>();
        for (const d of claimedDocs) {
          if (d.stock) {
            const sId = d.stock.toString();
            stockMap.set(sId, (stockMap.get(sId) || 0) + 1);
          }
          if (d.lot) {
            const lId = d.lot.toString();
            lotMap.set(lId, (lotMap.get(lId) || 0) + 1);
          }
        }

        // E. Decrease Stock Available Quantity atomically with precondition (no negative)
        for (const [stockId, count] of Array.from(stockMap.entries())) {
          const updatedStock = await StockModel.findOneAndUpdate(
            { _id: stockId },
            { $inc: { available_quantity: count } },
            { session, new: true }
          ).exec();

          if (!updatedStock) {
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Insufficient stock for stockId ${stockId} while fulfilling order`
            );
          }
        }

        // F. Decrease Lot qty_available atomically and set status to 'closed' if becomes zero
        for (const [lotId, count] of Array.from(lotMap.entries())) {
          const updatedLot = await LotModel.findOneAndUpdate(
            { _id: lotId },
            { $inc: { qty_available: count } },
            { session, new: true }
          ).exec();

          if (!updatedLot) {
            throw new ApiError(
              HttpStatusCode.BAD_REQUEST,
              `Insufficient lot quantity for lot ${lotId}`
            );
          }

          // If after decrement qty_available is 0, set status closed
          if ((updatedLot.qty_available ?? 0) >= 0) {
            await LotModel.findByIdAndUpdate(
              lotId,
              { $set: { status: "active" } },
              { session }
            );
          }
        }
      }
      order.is_return_product_scan = true;
      order.order_status =
        allItemsCounted === uniqBarcodes.length
          ? ORDER_STATUS.RETURNED
          : ORDER_STATUS.PARTIAL;
      // 6. Save Order (all item barcode arrays updated in-memory)
      await order.save({ session });

      await session.commitTransaction();
      return { success: true, message: "Barcodes assigned successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const UniqueBarcodeService = new Service();
