import { IInventory, IInventoryFilters } from "./inventory.interface";
import { InventoryModel } from "./inventory.model";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

class Service {
  async create(data: IInventory) {
    const exists = await InventoryModel.findOne({
      product: data.product,
      location: data.location,
    });

    if (exists) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "Inventory for this product at this location already exists. If you want to update the existing inventory, please use the update endpoint."
      );
    }

    return await InventoryModel.create(data);
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

    const { product, location } = filters;

    const queries: any = {};

    if (product) {
      queries.product = product;
    }
    if (location) {
      queries.location = location;
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
    const result = await InventoryModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return result;
  }
}

export const InventoryService = new Service();
