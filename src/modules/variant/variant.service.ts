import { BarcodeService } from "@/lib/barcode";
import { IUpdateVariantByProduct, IVariant } from "./variant.interface";
import { VariantModel } from "./variant.model";
import mongoose, { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { ProductModel } from "../product/product.model";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { StockModel } from "../stock/stock.model";

class Service {
  // this is for product service
  async createOne(
    data: IVariant,
    session?: mongoose.mongo.ClientSession
  ): Promise<IVariant> {
    const skuExists = await VariantModel.findOne({ sku: data.sku }).session(
      session || null
    );

    if (skuExists) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "SKU already exists. Please use a different SKU."
      );
    }

    data.barcode = BarcodeService.generateEAN13();
    if (session) {
      const [variant] = await VariantModel.create([data], { session });
      return variant.toObject();
    }
    const [variant] = await VariantModel.create([data]);
    return variant.toObject();
  }

  // create many from product service
  async createMany(data: IVariant[], session?: mongoose.mongo.ClientSession) {
    data.forEach((variant) => {
      variant.barcode = BarcodeService.generateEAN13();
    });
    if (session) {
      const variants = await VariantModel.insertMany(data, { session });
      return variants.map((v) => v.toObject());
    }
    const variants = await VariantModel.insertMany(data);
    return variants.map((v) => v.toObject());
  }

  // this is for REST API
  async createVariant(data: IVariant) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const skuExists = await VariantModel.findOne({
        sku: data.sku,
      });
      if (skuExists) {
        throw new ApiError(
          HttpStatusCode.CONFLICT,
          "SKU already exists. Please use a different SKU."
        );
      }

      data.barcode = BarcodeService.generateEAN13();
      const [variant] = await VariantModel.create([data], { session });

      await ProductModel.findByIdAndUpdate(
        variant.product,
        { $addToSet: { variants: variant._id } },
        { session }
      );

      await session.commitTransaction();
      return variant;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async updateOne(id: Types.ObjectId, data: Partial<IVariant>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid variant ID.");
    }

    const existingVariant = await VariantModel.findById(id);
    if (!existingVariant) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Variant not found.");
    }

    if (data.attributes) {
      if (!Array.isArray(data.attributes) || data.attributes.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Attributes must be a non-empty array of strings."
        );
      }
      if (
        !data.attributes.every(
          (attr) => typeof attr === "string" && attr.trim().length > 0
        )
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Each attribute must be a non-empty string."
        );
      }
    }

    if (data.attribute_values) {
      if (
        !(data.attribute_values instanceof Map) &&
        typeof data.attribute_values !== "object"
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "attribute_values must be a valid object/map."
        );
      }
      for (const [key, value] of Object.entries(
        data.attribute_values as Record<string, string>
      )) {
        if (
          !key ||
          typeof key !== "string" ||
          !value ||
          typeof value !== "string"
        ) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "attribute_values must have non-empty string keys and values."
          );
        }
      }
    }

    if (data.sku !== existingVariant.sku) {
      const skuExists = await VariantModel.findOne({
        sku: data.sku,
        _id: { $ne: id },
      });
      if (skuExists) {
        throw new ApiError(HttpStatusCode.CONFLICT, "SKU already exists.");
      }
    }

    const updatePayload: Partial<IVariant> = {
      ...data,
      sku: data.sku ?? existingVariant.sku,
    };

    const updatedVariant = await VariantModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    return updatedVariant;
  }

  async updateMany(variants: Partial<IVariant>[]) {
    const updates = variants.map((variant) => {
      if (!variant._id || !Types.ObjectId.isValid(variant._id)) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Each variant must have a valid _id for update."
        );
      }
      return this.updateOne(variant._id, variant);
    });

    return await Promise.all(updates);
  }

  async deleteVariant(id: Types.ObjectId) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid variant ID.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const variant = await VariantModel.findByIdAndDelete(id, { session });
      if (!variant) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Variant not found.");
      }

      await ProductModel.updateMany(
        { variants: id },
        { $pull: { variants: id } },
        { session }
      );

      await session.commitTransaction();
      return variant;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async removeVariantsByAProduct(
    product_id: Types.ObjectId,
    session?: mongoose.mongo.ClientSession
  ) {
    if (!Types.ObjectId.isValid(product_id)) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid product ID.");
    }

    const variants = await VariantModel.find({ product: product_id }).session(
      session || null
    );
    const variantIds = variants.map((v) => v._id);

    if (variantIds.length > 0) {
      await VariantModel.deleteMany({ _id: { $in: variantIds } }).session(
        session || null
      );
    }
  }

  async searchVariantsBySku(search_query: string, options: IPaginationOptions) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const searchCondition: any = {};
    if (search_query) {
      searchCondition.$or = [{ sku: { $regex: search_query, $options: "i" } }];
    }

    const result = await VariantModel.find({ ...searchCondition })
      .populate("product", "name slug sku thumbnail")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const total = await VariantModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async searchVariantsBySkuForAdmin(
    search_query: string,
    options: IPaginationOptions
  ) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const searchCondition: any = {};
    if (search_query) {
      searchCondition.$or = [{ sku: { $regex: search_query, $options: "i" } }];
    }

    const result = await VariantModel.find({ ...searchCondition })
      .populate("product", "name slug sku thumbnail is_published")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const stock = await StockModel.findOne({
      product: result[0]?.product._id,
      variant: result[0]?._id,
    });

    const data = result.map((item, idx) => {
      if (idx === 0) {
        return {
          ...(item.toObject?.() ?? item),
          stock: stock?.available_quantity || 0,
        };
      }
      return item;
    });

    const total = await VariantModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data,
    };
  }

  private toPlainAttrValues = (val: any): Record<string, string> => {
    if (!val) return {};
    if (val instanceof Map)
      return Object.fromEntries(val as Map<string, string>);
    return { ...val };
  };

  private makeSignature = (av: any): string => {
    const obj = this.toPlainAttrValues(av);
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => `${k}:${String(obj[k]).trim()}`)
      .join("|"); // e.g. "Color:Black|Size:39"
  };

  async ensureNoIncomingSkuDupes(
    variants: Array<{ sku?: string; attribute_values?: any }>
  ) {
    const seen = new Map<string, string>(); // sku -> signature
    for (const v of variants) {
      if (!v.sku) continue;
      const sig = this.makeSignature(v.attribute_values);
      const prev = seen.get(v.sku);
      if (prev && prev !== sig) {
        throw new Error(
          `Duplicate SKU in payload with different variants: ${v.sku}`
        );
      }
      seen.set(v.sku, sig);
    }
  }

  async updateVariantsOfAProduct(
    product_id: string,
    updateVariantPayload: IUpdateVariantByProduct
  ) {
    const session = await VariantModel.startSession();
    session.startTransaction();

    try {
      // 0) Validate payload
      if (!Array.isArray(updateVariantPayload.variants)) {
        throw new Error("variants array is required");
      }

      // 1) Check duplicate SKUs in incoming payload
      await this.ensureNoIncomingSkuDupes(updateVariantPayload.variants);

      // 2) Load existing variants
      const existingVariants = await VariantModel.find({
        product: product_id,
      }).session(session);

      // 3) Index existing variants
      const existingBySig = new Map<string, any>();
      const existingBySku = new Map<string, any>();
      for (const v of existingVariants) {
        const sig = this.makeSignature(v.attribute_values);
        if (sig) existingBySig.set(sig, v);
        if (v.sku) existingBySku.set(v.sku, v);
      }

      // 4) Track used variants
      const keepIds = new Set<string>();

      // 5) Process incoming payload
      for (const v of updateVariantPayload.variants) {
        const sig = this.makeSignature(v.attribute_values);
        const incSku = v.sku?.trim();

        if (!sig) throw new Error("attribute_values required for each variant");

        const target = existingBySig.get(sig);

        if (target) {
          // update in-place
          if (incSku) {
            const skuOwner = existingBySku.get(incSku);
            if (skuOwner && String(skuOwner._id) !== String(target._id)) {
              throw new Error(
                `SKU already exists on another variant: ${incSku}`
              );
            }
          }

          await VariantModel.updateOne(
            { _id: target._id },
            {
              $set: {
                attributes: updateVariantPayload.attributes,
                attribute_values: this.toPlainAttrValues(v.attribute_values),
                regular_price: v.regular_price,
                sale_price: v.sale_price,
                sku: incSku || target.sku,
                image: v.image ?? target.image ?? null,
              },
            },
            { session }
          );

          keepIds.add(String(target._id));
        } else {
          // create new
          if (incSku) {
            const skuOwner = existingBySku.get(incSku);
            if (skuOwner) {
              throw new Error(
                `SKU already exists on another variant: ${incSku}`
              );
            }
          }

          const newDoc = new VariantModel({
            barcode:
              v.barcode && v.barcode.trim()
                ? v.barcode.trim()
                : BarcodeService.generateEAN13(),
            attributes: updateVariantPayload.attributes,
            attribute_values: this.toPlainAttrValues(v.attribute_values),
            regular_price: v.regular_price,
            sale_price: v.sale_price,
            sku: incSku || undefined,
            image: v.image ?? null,
            product: product_id,
          });

          const saved = await newDoc.save({ session });
          keepIds.add(String(saved._id));

          // update indices
          existingBySig.set(sig, saved);
          if (incSku) existingBySku.set(incSku, saved);
        }
      }

      // 6) Delete unused variants
      const toDelete = existingVariants.filter(
        (ev) => !keepIds.has(String(ev._id))
      );
      if (toDelete.length) {
        await VariantModel.deleteMany(
          { _id: { $in: toDelete.map((d) => d._id) }, product: product_id },
          { session }
        );
      }

      // 7) Return updated list
      const updated = await VariantModel.find({ product: product_id })
        .session(session)
        .lean();

      // update product's variants
      await ProductModel.updateOne(
        { _id: product_id },
        { $set: { variants: updated.map((v) => v._id) } },
        { session }
      );

      await session.commitTransaction();
      return updated;
    } catch (err: any) {
      await session.abortTransaction();
      if (err?.code === 11000 && err?.keyPattern?.sku) {
        throw new Error(
          `Duplicate SKU not allowed: ${err?.keyValue?.sku || "unknown"}`
        );
      }
      throw err;
    } finally {
      session.endSession();
    }
  }

  // find min_price, max price and unique offer_tags
  async getMinMaxOfferTags(): Promise<{
    min_price: number;
    max_price: number;
  }> {
    const result = await VariantModel.aggregate([
      {
        $group: {
          _id: null,
          min_price: { $min: "$regular_price" },
          max_price: { $max: "$regular_price" },
        },
      },
    ]);

    return (
      result[0] || {
        min_price: 0,
        max_price: 0,
      }
    );
  }
}

export const VariantService = new Service();
