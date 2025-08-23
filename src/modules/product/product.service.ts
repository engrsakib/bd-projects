import ApiError from "@/middlewares/error";
import { IProduct } from "./product.interface";
import { ProductModel } from "./product.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { SlugifyService } from "@/lib/slugify";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { Types } from "mongoose";
import { emitter } from "@/events/eventEmitter";

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
      .populate("subcategory")
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
      .populate("subcategory")
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

  async getProductsByIds(ids: Types.ObjectId[]) {
    const products = await ProductModel.find({
      _id: { $in: ids },
      is_published: true,
    })
      .populate("category")
      .populate("subcategory")
      .lean();

    if (!products || products.length === 0) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Products were not found");
    }

    return products;
  }

  async getById(id: Types.ObjectId) {
    const product = await ProductModel.findById(id)
      .populate("category")
      .populate("subcategory")
      .lean();

    if (!product) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
    }

    return product;
  }

  async getBySlug(slug: string) {
    const product = await ProductModel.findOne({ slug })
      .populate("category")
      .populate("subcategory")
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

  async update(id: Types.ObjectId, data: Partial<IProduct>) {
    const isExist = await ProductModel.findById(id);

    if (!isExist) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Product not found to update"
      );
    }

    if (data?.name) {
      const isNameExist = await ProductModel.findOne({
        name: data.name,
        _id: { $ne: id },
      });
      if (isNameExist) {
        throw new ApiError(
          HttpStatusCode.CONFLICT,
          "This product name already exists. Please use a different name."
        );
      }
      data.slug = SlugifyService.generateSlug(data.name);
    }

    if (data?.thumbnail) {
      const isThumbnailChanged = isExist?.thumbnail !== data?.thumbnail;
      if (isThumbnailChanged) {
        console.log("Product thumbnail updated");
        // fire event to delete the thumbnail from AWS S3
        emitter.emit("s3.file.deleted", isExist?.thumbnail);
      }
    } else {
      console.log("Product thumbnail not updated");
    }

    // find the deleted slider images
    const newSliderImages = data?.slider_images || [];
    const oldSliderImages = isExist?.slider_images || [];
    const removedSliderImages = oldSliderImages.filter(
      (img) => !newSliderImages.includes(img)
    );

    if (removedSliderImages && removedSliderImages?.length > 0) {
      console.log("Product slider images updated");
      // fire event to delete slider images from AWS S3
      emitter.emit("s3.files.deleted", removedSliderImages);
    } else {
      console.log("Product slider images not updated");
    }

    await ProductModel.findByIdAndUpdate(id, data);
  }
}

export const ProductService = new Service();
