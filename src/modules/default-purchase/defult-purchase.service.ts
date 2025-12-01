import { PipelineStage, Types } from "mongoose";
import { DefaultsPurchaseModel } from "./defult-purchase.model";
import {
  DefaultsPurchaseQuery,
  IDefaultsPurchase,
} from "./default-purchase.interface";

import { VariantModel } from "../variant/variant.model";

class Service {
  async createPurchases(
    payload: any[]
  ): Promise<{ successful: IDefaultsPurchase[]; failed: any[] }> {
    const successful: IDefaultsPurchase[] = [];
    const failed: any[] = [];

    for (const data of payload) {
      const session = await DefaultsPurchaseModel.startSession();
      session.startTransaction();

      try {
        const variantId =
          data.variant instanceof Types.ObjectId
            ? data.variant
            : new Types.ObjectId(String(data.variant));

        const productId =
          data.product instanceof Types.ObjectId
            ? data.product
            : new Types.ObjectId(String(data.product));

        const supplierId =
          data.supplier == null
            ? null
            : data.supplier instanceof Types.ObjectId
              ? data.supplier
              : new Types.ObjectId(String(data.supplier));

        if (!variantId || !productId) {
          throw new Error("Variant and Product IDs are required");
        }

        const unit_cost =
          typeof data.unit_cost === "number" ? data.unit_cost : 0;
        const discount = typeof data.discount === "number" ? data.discount : 0;
        const tax = typeof data.tax === "number" ? data.tax : 0;

        let defaults = await DefaultsPurchaseModel.findOne({
          variant: variantId,
        }).session(session);

        if (defaults) {
          defaults.product = productId;
          defaults.supplier = supplierId;
          defaults.unit_cost = unit_cost;
          defaults.discount = discount;
          defaults.tax = tax;
          await defaults.save({ session });
        } else {
          const createdArr = await DefaultsPurchaseModel.create(
            [
              {
                variant: variantId,
                product: productId,
                supplier: supplierId,
                unit_cost,
                discount,
                tax,
              },
            ],
            { session }
          );
          defaults = createdArr[0];

          const variantDoc =
            await VariantModel.findById(variantId).session(session);
          if (!variantDoc) {
            throw new Error(`Variant not found with ID: ${variantId}`);
          }
          variantDoc.default_purchase = defaults._id as Types.ObjectId;
          await variantDoc.save({ session });
        }

        await session.commitTransaction();
        successful.push(defaults as IDefaultsPurchase);
      } catch (error: any) {
        await session.abortTransaction();
        failed.push({
          data,
          error: error.message || "Unknown Error",
        });
      } finally {
        session.endSession();
      }
    }

    return { successful, failed };
  }

  async getAllDefaultsPurchases(query: DefaultsPurchaseQuery): Promise<{
    meta: { page: number; limit: number; total: number; pages: number };
    data: IDefaultsPurchase[];
  }> {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      searchTerm,
      product,
      variant,
      supplier,
    } = query;

    const pipeline: PipelineStage[] = [];
    const matchStage: any = {};

    // 1. Direct filters (Top level)
    if (product && Types.ObjectId.isValid(product)) {
      matchStage.product = new Types.ObjectId(product);
    }
    if (variant && Types.ObjectId.isValid(variant)) {
      matchStage.variant = new Types.ObjectId(variant);
    }
    if (supplier && Types.ObjectId.isValid(supplier)) {
      matchStage.supplier = new Types.ObjectId(supplier);
    }

    // Apply initial match
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // 2. Lookups (Populate fields)
    pipeline.push(
      {
        $lookup: {
          from: "variants",
          localField: "variant",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
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

    // 3. Search Filter (SKU or Product Name)
    if (searchTerm) {
      const regex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      pipeline.push({
        $match: {
          $or: [
            { "variant.sku": { $regex: regex } },
            { "product.name": { $regex: regex } },
          ],
        },
      });
    }

    // 4. Pagination & Sorting calculations
    const _page = Math.max(Number(page), 1);
    const _limit = Math.max(Number(limit), 1);
    const _skip = (_page - 1) * _limit;
    const _sortOrder = sortOrder === "asc" ? 1 : -1;

    // 5. Facet for Data and Meta (Total Count)
    pipeline.push({
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $sort: { [sortBy]: _sortOrder } },
          { $skip: _skip },
          { $limit: _limit },
        ],
      },
    });

    // Execute Aggregation
    const result = await DefaultsPurchaseModel.aggregate(pipeline).exec();

    const meta = result[0]?.meta?.[0] ?? { total: 0 };
    const data = result[0]?.data ?? [];
    const total = meta.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / _limit));

    return {
      meta: {
        total,
        page: _page,
        limit: _limit,
        pages,
      },
      data,
    };
  }
}

export const DefaultsPurchaseService = new Service();
