import { BarcodeService } from "@/lib/barcode";
import { IInventory, IInventoryFilters } from "./inventory.interface";
import { InventoryModel } from "./inventory.model";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";

class Service {
  async create(data: IInventory) {
    for (const variant of data.variants) {
      variant.barcode = BarcodeService.generateEAN13();
    }

    await InventoryModel.create(data);
  }

  async getAllInventories(
    options: IPaginationOptions,
    filters: IInventoryFilters
  ) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const {
      product,
      location,
      attributes,
      sku,
      barcode,
      attribute_values,
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

    if (attribute_values) {
      for (const [key, value] of Object.entries(attribute_values)) {
        variantConditions.push({ [`variants.attribute_values.${key}`]: value });
      }
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
}

export const InventoryService = new Service();
