import ApiError from "@/middlewares/error";
import { IProduct } from "./product.interface";
import { ProductModel } from "./product.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { SlugifyService } from "@/lib/slugify";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { Types } from "mongoose";

class Service {
  async create(data: IProduct) {
    const isExist = await ProductModel.findOne({ name: data.name });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "Product already exist with this name. Please choose a different name."
      );
    }

    // generate slug from name
    data.slug = SlugifyService.generateSlug(data.name);

    await ProductModel.create(data);
  }

  async getAllProducts(options: IPaginationOptions, search_query: string) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const queries: any = {};
    if (search_query) {
      queries.$or = [{ name: { $regex: search_query, $options: "i" } }];
    }

    const result = await ProductModel.find({
      ...queries,
    })
      .populate("category")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductModel.countDocuments(queries);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getAllPublishedProducts(
    options: IPaginationOptions,
    search_query: string
  ) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const queries: any = {};
    if (search_query) {
      queries.$or = [{ name: { $regex: search_query, $options: "i" } }];
    }

    const result = await ProductModel.find({
      ...queries,
      is_published: true,
    })
      .populate("category")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductModel.countDocuments({
      ...queries,
      is_published: true,
    });

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getById(id: Types.ObjectId) {
    const product = await ProductModel.findById(id).populate("category").lean();

    if (!product) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
    }

    return product;
  }

  async getBySlug(slug: string) {
    const product = await ProductModel.findOne({ slug })
      .populate("category")
      .lean();

    if (!product) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
    }

    return product;
  }

  async toggleVisibility(id: Types.ObjectId) {
    const product = await ProductModel.findById(id).lean();
    if (!product) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
    }

    await ProductModel.findByIdAndUpdate(id, {
      is_published: !product.is_published,
    });
  }
}

export const ProductService = new Service();
