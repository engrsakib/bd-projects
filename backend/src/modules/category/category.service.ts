import slugify from "slugify";
import { ICategory } from "./category.interface";
import { CategoryModel } from "./category.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { emitter } from "@/events/eventEmitter";
import { CATEGORY_STATUS_ENUM, ICategoryStatus } from "./category.enums";

class Service {
  // ADMIN & VENDOR Services
  async create(data: ICategory) {
    const isExist = await CategoryModel.findOne({ name: data.name });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "This category is already exists. Please use a different name."
      );
    }
    data.slug = slugify(data.name, { lower: true });
    await CategoryModel.create(data);
  }

  async getAll(options: IPaginationOptions, search_query: string) {
    const {
      limit = 10,
      page = 1,
      skip,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationHelpers.calculatePagination(options);

    const searchCondition: any = {};
    if (search_query) {
      searchCondition.$or = [{ name: { $regex: search_query, $options: "i" } }];
    }

    const result = await CategoryModel.find({ ...searchCondition })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const total = await CategoryModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getById(id: string) {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found.");
    }
    return category;
  }

  async update(id: string, data: Partial<ICategory>) {
    const isExist = await CategoryModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found.");
    }
    if (data?.name) {
      const isNameExist = await CategoryModel.findOne({
        name: data.name,
        _id: { $ne: id },
      });
      if (isNameExist) {
        throw new ApiError(
          HttpStatusCode.CONFLICT,
          "This category name already exists. Please use a different name."
        );
      }
      data.slug = slugify(data.name, { lower: true });
    }

    // check either image changed or not
    if (data?.image) {
      const isImageChanged = data?.image !== isExist?.image;
      if (isImageChanged) {
        console.log(`[Service] - Category image updated`);
        // fire event to delete the old image from AWS S3 bucket
        emitter.emit("s3.file.deleted", isExist?.image);
      }
    } else {
      console.log(`[Service] - Category image not updated`);
    }
    await CategoryModel.findByIdAndUpdate(id, data);
  }

  async updateStatus(id: string, status: ICategoryStatus) {
    const isExist = await CategoryModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Category was not found!");
    }

    await CategoryModel.findByIdAndUpdate(id, { status });
  }

  // PUBLIC Services
  async getAvailableCategories(
    search_query: string,
    sortBy: "name" | "serial" | "createdAt" = "createdAt",
    sortOrder: "desc" | "asc" = "asc"
  ) {
    const searchCondition: any = {};
    if (search_query) {
      searchCondition.$or = [{ name: { $regex: search_query, $options: "i" } }];
    }
    return await CategoryModel.find({
      ...searchCondition,
      status: CATEGORY_STATUS_ENUM.APPROVED,
    })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .populate("subcategories");
  }

  async getBySlug(slug: string) {
    const category = await CategoryModel.findOne({
      slug,
      status: CATEGORY_STATUS_ENUM.APPROVED,
    }).populate("subcategories");
    if (!category) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Category not found.");
    }
    return category;
  }
}

export const CategoryService = new Service();
