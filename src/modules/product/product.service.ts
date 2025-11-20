/* eslint-disable prefer-const */
import ApiError from "@/middlewares/error";
import {
  ICreateProductPayload,
  IProduct,
  IProductFilters,
} from "./product.interface";
import { ProductModel } from "./product.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { SlugifyService } from "@/lib/slugify";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import mongoose, { Types } from "mongoose";
import { emitter } from "@/events/eventEmitter";
import { generateUniqueCode } from "@/utils/generateUniqueCode";
import { VariantService } from "../variant/variant.service";
import { productSearchableFields } from "./product.constants";
import { IVariant } from "../variant/variant.interface";
import { SubcategoryModel } from "../subcategory/subcategory.model";
import { CategoryModel } from "../category/category.model";

class Service {
  async create(data: ICreateProductPayload): Promise<IProduct> {
    const { variants = [], ...rest } = data;
    console.log(variants, "vat");
    // Start a session for transaction
    const session = await ProductModel.startSession();
    session.startTransaction();

    try {
      if (rest.name) {
        rest.slug = await this.generateProductUniqueSlug(rest.name);
      }

      //  ======== also need to generate SKU code from system ===========

      const product = await ProductModel.create([rest], {
        session,
      }).then((res) => res[0]);

      if (variants && variants.length > 0) {
        //  add product id
        variants.forEach((variant: any) => {
          variant.product = product._id as Types.ObjectId;
          variant.attributes = rest.attributes;
        });

        // save all variants and get their ids
        const newVariants = await VariantService.createMany(
          variants as IVariant[],
          session
        );
        const newVariantIds = newVariants.map(
          (variant) => variant._id
        ) as Types.ObjectId[];
        product.variants = newVariantIds;
      }

      // save the product with variants ids
      await product.save({ session });

      await session.commitTransaction();
      return product;
    } catch (error: any) {
      console.log(error);
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        error || "Failed to create product"
      );
    } finally {
      session.endSession();
    }
  }

  // Replace your normalizeObjectIdList with this:
  private normalizeSlugList(
    input: string | string[] | undefined,
    label?: string
  ): string[] {
    const raw = Array.isArray(input) ? input : input ? [input] : [];
    const slugs = raw
      .flatMap((v) => String(v).split(",")) // support comma + array
      .map((v) => v.trim().toLowerCase()) // normalize
      .filter(Boolean);

    // (Optional) simple slug guard — keep if you want stricter input
    const invalid = slugs.filter((s) => /[^a-z0-9-_]/i.test(s));
    if (invalid.length)
      throw new ApiError(
        400,
        `Invalid ${label} slug(s): ${invalid.join(", ")}`
      );

    return slugs;
  }

  async getAllProducts(options: IPaginationOptions, filters: IProductFilters) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);
    const {
      search_query,
      stock,
      category,
      subcategory,
      tags,
      max_price,
      min_price,
      color,
      size,
    } = filters;

    const andConditions = [];

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

    // Category & Subcategory by slug (support single, array, comma list)
    // NOTE: assumes Products.category / Products.subcategory store ObjectId refs
    const categorySlugs = this.normalizeSlugList(category as any, "category");
    const subcategorySlugs = this.normalizeSlugList(
      subcategory as any,
      "subcategory"
    );

    if (categorySlugs.length) {
      const cats = await CategoryModel.find(
        { slug: { $in: categorySlugs } },
        { _id: 1 }
      ).lean();
      if (!cats.length) {
        throw new ApiError(
          404,
          `Category not found by slug(s): ${categorySlugs.join(", ")}`
        );
      }
      andConditions.push({ category: { $in: cats.map((c: any) => c._id) } });
    }

    if (subcategorySlugs.length) {
      const subs = await SubcategoryModel.find(
        { slug: { $in: subcategorySlugs } },
        { _id: 1 }
      ).lean();
      if (!subs.length) {
        throw new ApiError(
          404,
          `Subcategory not found by slug(s): ${subcategorySlugs.join(", ")}`
        );
      }
      andConditions.push({
        subcategory: { $in: subs.map((s: any) => s._id) },
      });
    }

    // Always show only published products
    andConditions.push({
      is_published: true,
    });

    if (tags && Array.isArray(tags) && tags.length > 0) {
      andConditions.push({
        search_tags: { $in: tags },
      });
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const pipeline: any[] = [
      { $match: whereConditions },
      {
        $lookup: {
          from: "variants",
          localField: "variants",
          foreignField: "_id",
          as: "populated_variants",
        },
      },

      {
        $addFields: {
          filtered_variants: {
            $cond: {
              if: {
                $or: [
                  { $ne: [color, null] },
                  { $ne: [size, null] },
                  { $ne: [min_price, null] },
                  { $ne: [max_price, null] },
                  { $ne: [stock, null] },
                ],
              },
              then: {
                $filter: {
                  input: "$populated_variants",
                  as: "variant",
                  cond: {
                    $and: [
                      ...(color
                        ? [
                            {
                              $eq: [
                                {
                                  $ifNull: [
                                    "$$variant.attribute_values.Color",
                                    "",
                                  ],
                                },
                                color,
                              ],
                            },
                          ]
                        : []),
                      ...(size
                        ? [
                            {
                              $eq: [
                                {
                                  $ifNull: [
                                    "$$variant.attribute_values.Size",
                                    "",
                                  ],
                                },
                                size,
                              ],
                            },
                          ]
                        : []),
                      ...(min_price
                        ? [{ $gte: ["$$variant.regular_price", min_price] }]
                        : []),
                      ...(max_price
                        ? [{ $lte: ["$$variant.regular_price", max_price] }]
                        : []),
                      ...(stock === "in"
                        ? [{ $gt: ["$$variant.available_quantity", 0] }]
                        : []),
                      ...(stock === "out"
                        ? [{ $lte: ["$$variant.available_quantity", 0] }]
                        : []),
                    ],
                  },
                },
              },
              else: "$populated_variants",
            },
          },
        },
      },

      {
        $match: {
          is_published: true,
          $or: [
            { filtered_variants: { $exists: true, $ne: [] } },
            { populated_variants: { $exists: true, $ne: [] } },
          ],
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
          createdAt: 1,
          updatedAt: 1,
          attributes: "$inventory.attributes",
          variants: "$filtered_variants",
        },
      },

      { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const result = await ProductModel.aggregate(pipeline);

    const total = await ProductModel.countDocuments(whereConditions);

    const { min_price: lowest_price, max_price: highest_price } =
      await VariantService.getMinMaxOfferTags();
    const offerTagsResult = await ProductModel.aggregate([
      { $unwind: "$offer_tags" },
      {
        $group: {
          _id: null,
          offer_tags: {
            $addToSet: {
              $replaceAll: {
                input: {
                  $replaceAll: {
                    input: { $toUpper: "$offer_tags" },
                    find: "-",
                    replacement: " ",
                  },
                },
                find: "_",
                replacement: " ",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          offer_tags: { $sortArray: { input: "$offer_tags", sortBy: 1 } },
        },
      },
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        min_price: lowest_price,
        max_price: highest_price,
        offer_tags: offerTagsResult[0]?.offer_tags || [],
      },
      data: result,
    };
  }

  async getAllProductsForAdmin(
    options: IPaginationOptions,
    filters: IProductFilters,
    randomize: boolean = false
  ) {
    const {
      limit,
      page,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const {
      search_query,
      category,
      subcategory,
      tags,
      is_published,
      location,
      sku,
    } = filters;

    const andConditions: any[] = [];

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
          return { [field]: { $regex: search_query, $options: "i" } };
        }),
      });
    }

    if (category && mongoose.isValidObjectId(category)) {
      andConditions.push({
        category: new mongoose.Types.ObjectId(category),
      });
    }

    if (subcategory && mongoose.isValidObjectId(subcategory)) {
      andConditions.push({
        subcategory: new mongoose.Types.ObjectId(subcategory),
      });
    }

    if (is_published !== undefined) {
      andConditions.push({ is_published });
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      andConditions.push({ search_tags: { $in: tags } });
    }

    const matcher: any =
      andConditions.length > 0 ? { $and: andConditions } : {};

    if (sku) {
      matcher.sku = { $regex: sku, $options: "i" };
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "product",
          as: "variants",
        },
      },

      {
        $lookup: {
          from: "stocks",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$product", "$$productId"] },
              },
            },
            {
              $lookup: {
                from: "locations",
                localField: "location",
                foreignField: "_id",
                as: "location",
              },
            },
          ],
          as: "stocks",
        },
      },

      // ✅ Apply location filter AFTER lookup
      ...(location && mongoose.isValidObjectId(location)
        ? [
            {
              $match: {
                "stocks.location._id": new mongoose.Types.ObjectId(location),
              },
            },
          ]
        : []),

      // Category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // Subcategory
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      // Randomize (if enabled)
      ...(randomize ? [{ $sample: { size: limit } }] : []),

      // Sort + Paginate
      { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
      ...(randomize ? [] : [{ $skip: skip }, { $limit: limit }]),
    ];

    const [agg] = await ProductModel.aggregate([
      { $match: matcher },
      {
        $facet: {
          data: [...pipeline, { $sort: { createdAt: -1 } }],
          total: [{ $count: "total" }],
        },
      },
    ]);

    const data = agg?.data ?? [];
    const total = agg?.total?.[0]?.total ?? 0;

    return {
      meta: { page, limit, total },
      data,
    };
  }

  async findAllProducts(
    search_query?: string,
    is_published?: boolean,
    fields?: string[]
  ) {
    const defaultProjection: Record<string, number> = {
      name: 1,
      slug: 1,
      thumbnail: 1,
    };
    if (fields && fields.length > 0) {
      // make the fields array as key-value object like {[key] : 1}
      fields.forEach((key) => {
        if (key) {
          defaultProjection[key] = 1;
        }
      });
    }

    console.log({ defaultProjection, fields });

    const andConditions: any[] = [];

    if (search_query) {
      andConditions.push({
        $or: productSearchableFields.map((field) => ({
          [field]: { $regex: search_query, $options: "i" },
        })),
      });
    }

    if (is_published !== undefined) {
      andConditions.push({ is_published });
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const products = await ProductModel.find(whereConditions)
      .select(defaultProjection)
      .lean();

    return products;
  }

  async getRelatedOrders(categoryId: string): Promise<IProduct[]> {
    const products = await ProductModel.find({
      category: categoryId,
      is_published: true,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: "subcategory",
        select: "name slug",
      })
      .populate({
        path: "variants",
        select:
          "attributes attribute_values regular_price sale_price sku barcode image",
      })
      .lean();

    return products as IProduct[];
  }

  async getProductsByIds(ids: Types.ObjectId[]) {
    const products = await ProductModel.find({
      _id: { $in: ids },
      is_published: true,
    })
      .populate("category")
      .populate("subcategory")
      .populate("variants")
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
      .populate("variants")
      .lean();

    if (!product) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
    }

    return product;
  }

  async getBySlug(slug: string) {
    const product = await ProductModel.findOne({ slug, is_published: true })
      .populate("category")
      .populate("subcategory")
      .populate("variants")
      .lean();

    if (!product) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
    }

    return product;
  }

  // get product by slug or title
  async getBySlugAndTitle(
    slug?: string,
    title?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    // base match
    const match: any = { is_published: true };

    // slug/title filter build করা
    const orArr: any[] = [];

    if (slug && slug.trim() !== "") {
      orArr.push({ slug: { $regex: slug, $options: "i" } });
    }

    if (title && title.trim() !== "") {
      orArr.push({ title: { $regex: title, $options: "i" } });
    }

    // যদি slug বা title এর যেকোনো একটা থাকে
    if (orArr.length > 0) {
      match.$or = orArr;
    }

    const pipeline = [
      { $match: match },
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
        $lookup: {
          from: "variants",
          localField: "variants",
          foreignField: "_id",
          as: "variants",
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const products = await ProductModel.aggregate(pipeline);

    const total = await ProductModel.countDocuments(match);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
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

    // disallow duplicate SKU
    if (data?.sku) {
      const isSkuExist = await ProductModel.findOne({
        sku: data.sku,
        _id: { $ne: id },
      });
      if (isSkuExist) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          `The SKU: ${data.sku} is already exists. Please choose a different one.`
        );
      }
    }

    // শুধু নতুন নাম আসলে slug আপডেট হবে, পুরাতন নামের সাথে মিললে হবে না
    if (data?.name && data.name !== isExist.name) {
      data.slug = await this.generateProductUniqueSlug(data.name);
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

  async deleteProduct(id: Types.ObjectId) {
    // use session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await ProductModel.findById(id).lean();
      if (!product) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Product was not found");
      }

      await ProductModel.findByIdAndDelete(id);
      await VariantService.removeVariantsByAProduct(id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async generateProductUniqueSlug(name: string): Promise<string> {
    const baseSlug = SlugifyService.generateSlug(name);
    let slug: string = "";
    let exists = true;

    while (exists) {
      const uniqueCode = generateUniqueCode(4);
      slug = `${baseSlug}-${uniqueCode}`;
      const existProduct = await ProductModel.findOne({ slug });
      exists = existProduct ? true : false;
    }

    return slug;
  }
}

export const ProductService = new Service();
