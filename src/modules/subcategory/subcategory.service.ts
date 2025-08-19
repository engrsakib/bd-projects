import ApiError from "@/middlewares/error";
import { ISubcategory } from "./subcategory.interface";
import { SubcategoryModel } from "./subcategory.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import slugify from "slugify";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { emitter } from "@/events/eventEmitter";
import {
  ISubcategoryStatus,
  SUBCATEGORY_STATUS_ENUM,
} from "./subcategory.enums";

class Service {
  // ==== ADMIN services ======
  async create(data: ISubcategory) {
    const isExist = await SubcategoryModel.findOne({ name: data.name });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "This subcategory is already exists. Please use a different name."
      );
    }
    data.slug = slugify(data.name, { lower: true });
    await SubcategoryModel.create(data);
  }

  async getAll(
    options: IPaginationOptions,
    search_query: string,
    status: ISubcategoryStatus
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

    if (status) {
      queries.status = status;
    }
    const result = await SubcategoryModel.find({ ...queries })
      .populate("category")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const total = await SubcategoryModel.countDocuments(queries);

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
    const result = await SubcategoryModel.findById(id).populate("category");
    if (!result) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Sub category was not found!"
      );
    }
    return result;
  }

  async update(id: string, data: Partial<ISubcategory>) {
    const isExist = await SubcategoryModel.findById(id);
    if (!isExist) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Sub category was not found!"
      );
    }
    if (data?.name) {
      const isNameExist = await SubcategoryModel.findOne({
        name: data.name,
        _id: { $ne: id },
      });
      if (isNameExist) {
        throw new ApiError(
          HttpStatusCode.CONFLICT,
          "This subcategory name already exists. Please use a different name."
        );
      }
      data.slug = slugify(data.name, { lower: true });
    }

    // check either image changed or not
    if (data?.image) {
      const isImageChanged = data?.image !== isExist?.image;
      if (isImageChanged) {
        console.log(`[Service] - Subcategory image updated`);
        // fire event to delete the old image from AWS S3 bucket
        emitter.emit("s3.file.deleted", isExist?.image);
      }
    } else {
      console.log(`[Service] - Subcategory image not updated`);
    }

    await SubcategoryModel.findByIdAndUpdate(id, data);
  }

  async getByCategory(category_id: string) {
    return await SubcategoryModel.find({ category: category_id }).populate(
      "category"
    );
  }

  // ==== ADMIN services ======
  async getAllAvailable(options: IPaginationOptions, search_query: string) {
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

    const result = await SubcategoryModel.find({
      ...searchCondition,
      status: SUBCATEGORY_STATUS_ENUM.APPROVED,
    })
      .populate("category")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const total = await SubcategoryModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getAvailableByCategory(category_id: string) {
    return await SubcategoryModel.find({
      category: category_id,
      status: SUBCATEGORY_STATUS_ENUM.APPROVED,
    }).populate("category");
  }

  async getBySlug(slug: string) {
    const result = await SubcategoryModel.findOne({
      slug,
      status: SUBCATEGORY_STATUS_ENUM.APPROVED,
    }).populate("category");
    if (!result) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Sub category was not found!"
      );
    }
    return result;
  }
}

export const SubcategoryService = new Service();
