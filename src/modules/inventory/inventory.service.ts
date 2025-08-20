import { BarcodeService } from "@/lib/barcode";
import { IInventory, IInventoryFilters, IVariant } from "./inventory.interface";
import { InventoryModel } from "./inventory.model";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

class Service {
  async create(data: IInventory) {
    for (const variant of data.variants) {
      variant.barcode = BarcodeService.generateEAN13();
    }

    await InventoryModel.create(data);
  }

  async getAllInventories(
    pagination: IPaginationOptions,
    filters: IInventoryFilters
  ) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(pagination);

    const {
      product,
      location,
      attributes,
      sku,
      barcode,
      regular_price_min,
      regular_price_max,
      sale_price_min,
      sale_price_max,
      available_quantity_min,
      available_quantity_max,
      total_sold_min,
      total_sold_max,
    } = filters;

    const queries: any = {};

    if (product) {
      queries.product = product;
    }
    if (location) {
      queries.location = location;
    }
    if (attributes) {
      queries.attributes = { $in: [attributes] };
    }

    // Variant-level filters (inside `variants`)
    const variantConditions: any[] = [];

    if (sku) {
      variantConditions.push({ "variants.sku": sku });
    }
    if (barcode) {
      variantConditions.push({ "variants.barcode": barcode });
    }

    if (regular_price_min || regular_price_max) {
      variantConditions.push({
        "variants.regular_price": {
          ...(regular_price_min && { $gte: regular_price_min }),
          ...(regular_price_max && { $lte: regular_price_max }),
        },
      });
    }

    if (sale_price_min || sale_price_max) {
      variantConditions.push({
        "variants.sale_price": {
          ...(sale_price_min && { $gte: sale_price_min }),
          ...(sale_price_max && { $lte: sale_price_max }),
        },
      });
    }

    if (available_quantity_min || available_quantity_max) {
      variantConditions.push({
        "variants.available_quantity": {
          ...(available_quantity_min && { $gte: available_quantity_min }),
          ...(available_quantity_max && { $lte: available_quantity_max }),
        },
      });
    }

    if (total_sold_min || total_sold_max) {
      variantConditions.push({
        "variants.total_sold": {
          ...(total_sold_min && { $gte: total_sold_min }),
          ...(total_sold_max && { $lte: total_sold_max }),
        },
      });
    }

    if (variantConditions.length > 0) {
      queries.$and = variantConditions;
    }

    const result = await InventoryModel.find(queries)
      .populate("product")
      .populate("location")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryModel.countDocuments(queries);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getInventoriesByProduct(product_id: Types.ObjectId) {
    const result = await InventoryModel.find({
      product: new Types.ObjectId(product_id),
    })
      .populate("product")
      .populate("location")
      .sort({ createdAt: -1 });

    return result;
  }

  async getInventoriesByLocation(location_id: Types.ObjectId) {
    const result = await InventoryModel.find({
      location: new Types.ObjectId(location_id),
    })
      .populate("product")
      .populate("location")
      .sort({ createdAt: -1 });

    return result;
  }

  async updateInventory(id: Types.ObjectId, data: Partial<IInventory>) {
    const isExist = await InventoryModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Inventory was not found");
    }
    await InventoryModel.findByIdAndUpdate(id, data);
  }

  async addVariant(inventory_id: Types.ObjectId, data: IVariant) {
    data.barcode = BarcodeService.generateEAN13();
    const updated = await InventoryModel.findOneAndUpdate(
      { _id: inventory_id },
      { $push: { variants: data } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Inventory not found");
    }
  }

  async updateVariant(variant_id: Types.ObjectId, data: Partial<IVariant>) {
    const setData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      setData[`variants.$.${key}`] = value;
    }

    const updated = await InventoryModel.findOneAndUpdate(
      { "variants._id": variant_id },
      { $set: setData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Variant not found");
    }
  }
}

export const InventoryService = new Service();
