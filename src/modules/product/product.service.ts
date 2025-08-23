import ApiError from "@/middlewares/error";
import { IProduct, IProductFilters } from "./product.interface";
import { ProductModel } from "./product.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { SlugifyService } from "@/lib/slugify";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import mongoose, { Types } from "mongoose";
import { emitter } from "@/events/eventEmitter";
import { generateUniqueCode } from "@/utils/generateUniqueCode";
import { VariantService } from "../variant/variant.service";
import { IVariant } from "../variant/variant.interface";
import { productSearchableFields } from "./product.constants";

class Service {
  async create(data: IProduct): Promise<IProduct> {
    // Start a session for transaction
    const session = await ProductModel.startSession();
    session.startTransaction();

    try {
      if (data.name) {
        const baseSlug = SlugifyService.generateSlug(data.name);
        let slug: string = "";
        let exists = true;

        while (exists) {
          const uniqueCode = generateUniqueCode();
          slug = `${baseSlug}-${uniqueCode}`;
          const existProduct = await ProductModel.findOne({ slug });
          exists = existProduct ? true : false;
        }

        data.slug = slug;
      }

      //  ======== also need to generate SKU code from system ===========

      const product = await ProductModel.create([data], {
        session,
      }).then((res) => res[0]);

      const variants = (data.variants || []) as IVariant[];
      if (variants && variants.length > 0) {
        // save all variants and get their ids
        const newVariants = await VariantService.createMany(variants, session);
        const newVariantIds = newVariants.map(
          (variant) => variant._id
        ) as Types.ObjectId[];
        product.variants = newVariantIds;
      }

      await session.commitTransaction();
      return product;
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to create product"
      );
    } finally {
      session.endSession();
    }
  }

  async getAllProducts(options: IPaginationOptions, filters: IProductFilters) {
    // Start a session for transaction
    const session = await ProductModel.startSession();
    session.startTransaction();

    try {
      const {
        limit,
        page,
        skip,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = paginationHelpers.calculatePagination(options);
      const {
        search_query,
        stock,
        category,
        tags,
        max_price,
        min_price,
        color,
        size,
      } = filters;

      // Build query conditions
      const andConditions = [];

      // Search query filter
      if (search_query) {
        andConditions.push({
          $or: productSearchableFields.map((field: string) => {
            if (field === "search_tags") {
              return {
                [field]: {
                  $elemMatch: { $regex: search_query, $options: "i" },
                },
              };
            }
            return {
              [field]: {
                $regex: search_query,
                $options: "i",
              },
            };
          }),
        });
      }

      // Filter by category ID
      if (category && mongoose.isValidObjectId(category)) {
        andConditions.push({
          category: new mongoose.Types.ObjectId(category),
        });
      }

      // Always show only published products
      andConditions.push({
        is_published: true,
      });

      // Tags filter
      if (tags && Array.isArray(tags) && tags.length > 0) {
        andConditions.push({
          search_tags: { $in: tags },
        });
      }

      const whereConditions =
        andConditions.length > 0 ? { $and: andConditions } : {};

      // Aggregation pipeline
      const pipeline: any[] = [
        { $match: whereConditions },
        {
          $lookup: {
            from: "inventories",
            localField: "_id",
            foreignField: "product",
            as: "inventory",
          },
        },
        {
          $unwind: {
            path: "$inventory",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$inventory.variants",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            ...(color && {
              "inventory.variants.attribute_values.Color": color,
            }),
            ...(size && { "inventory.variants.attribute_values.Size": size }),
            ...(min_price !== undefined &&
              !isNaN(min_price) && {
                "inventory.variants.regular_price": { $gte: min_price },
              }),
            ...(max_price !== undefined &&
              !isNaN(max_price) && {
                "inventory.variants.regular_price": { $lte: max_price },
              }),
            ...(stock === "in" && {
              "inventory.variants.available_quantity": { $gt: 0 },
            }),
            ...(stock === "out" && {
              "inventory.variants.available_quantity": { $lte: 0 },
            }),
          },
        },
        {
          $group: {
            _id: {
              productId: "$_id",
              attribute_values: "$inventory.variants.attribute_values",
            },
            product: { $first: "$$ROOT" },
            attributes: { $first: "$inventory.attributes" },
            regular_price: { $last: "$inventory.variants.regular_price" },
            sale_price: { $last: "$inventory.variants.sale_price" },
            sku: { $last: "$inventory.variants.sku" },
            barcode: { $last: "$inventory.variants.barcode" },
            available_quantity: {
              $sum: "$inventory.variants.available_quantity",
            },
            image: { $last: "$inventory.variants.image" },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
            product: { $first: "$product" },
            attributes: { $first: "$attributes" },
            variants: {
              $push: {
                attribute_values: "$_id.attribute_values",
                regular_price: "$regular_price",
                sale_price: "$sale_price",
                sku: "$sku",
                barcode: "$barcode",
                available_quantity: "$available_quantity",
                queue_order_quantity: "$queue_order_quantity",
                image: "$image",
              },
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$product",
                {
                  attributes: "$attributes",
                  variants: "$variants",
                },
              ],
            },
          },
        },
        {
          $match: {
            attributes: { $ne: null, $not: { $size: 0 } },
            variants: {
              $elemMatch: {
                attribute_values: { $ne: null },
                regular_price: { $ne: null },
                sale_price: { $ne: null },
                sku: { $ne: null },
                barcode: { $ne: null },
                available_quantity: { $gt: 0 },
              },
            },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "subcategories",
            localField: "subcategory",
            foreignField: "_id",
            as: "subcategory",
          },
        },
        { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            description: 1,
            thumbnail: 1,
            category: 1,
            subcategory: 1,
            is_published: 1,
            search_tags: 1,
            min_order_qty: 1,
            max_order_qty: 1,
            total_sold: 1,
            approximately_delivery_time: 1,
            is_free_delivery: 1,
            coin_per_order: 1,
            shipping_cost: 1,
            shipping_cost_per_unit: 1,
            warranty: 1,
            return_policy: 1,
            total_rating: 1,
            offer_tags: 1,
            reviews: 1,
            createdAt: 1,
            updatedAt: 1,
            attributes: 1,
            variants: {
              $cond: {
                if: { $isArray: "$variants" },
                then: "$variants",
                else: [],
              },
            },
          },
        },
        { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit },
        { $sample: { size: Number.MAX_SAFE_INTEGER } },
      ];

      // Execute aggregation
      const result = await ProductModel.aggregate(pipeline).session(session);

      // Get total count of products (before pagination)
      const total =
        await ProductModel.countDocuments(whereConditions).session(session);

      await session.commitTransaction();
      return {
        meta: {
          page,
          limit,
          total,
        },
        data: result,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // async getAllProducts(options: IPaginationOptions, search_query: string) {
  //   const {
  //     limit = 10,
  //     page = 1,
  //     skip,
  //     sortBy = "createdAt",
  //     sortOrder = "desc",
  //   } = paginationHelpers.calculatePagination(options);

  //   const queries: any = {};
  //   if (search_query) {
  //     queries.$or = [{ name: { $regex: search_query, $options: "i" } }];
  //   }

  //   const result = await ProductModel.find({
  //     ...queries,
  //   })
  //     .populate("category")
  //     .populate("subcategory")
  //     .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
  //     .skip(skip)
  //     .limit(limit)
  //     .lean();

  //   const total = await ProductModel.countDocuments(queries);

  //   return {
  //     meta: {
  //       page,
  //       limit,
  //       total,
  //     },
  //     data: result,
  //   };
  // }

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
