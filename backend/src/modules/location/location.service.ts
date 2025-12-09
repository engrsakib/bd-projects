import ApiError from "@/middlewares/error";
import { ILocation } from "./location.interface";
import { LocationModel } from "./location.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { SlugifyService } from "@/lib/slugify";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";

class Service {
  async create(data: ILocation) {
    const isExist = await LocationModel.findOne({ name: data.name });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `This location: '${data.name}' with type: '${data?.type || "warehouse"}' is already exist. Please enter a different name.`
      );
    }
    // generate slug from name
    data.slug = SlugifyService.generateSlug(data.name);
    await LocationModel.create(data);
  }

  async getById(id: string) {
    const location = await LocationModel.findById(id);
    if (!location) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Location not found.");
    }
    return location;
  }

  async getBySlug(slug: string) {
    const location = await LocationModel.findOne({ slug });
    if (!location) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Location not found.");
    }
    return location;
  }

  async getAllLocations(
    options: IPaginationOptions,
    search_query: string,
    type?: "outlet" | "warehouse" | "distribution_center"
  ) {
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (search_query) {
      filter.$or = [
        { name: { $regex: search_query, $options: "i" } },
        { slug: { $regex: search_query, $options: "i" } },
        { "address.local_address": { $regex: search_query, $options: "i" } },
      ];
    }

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination(options);
    const locations = await LocationModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 });

    const total = await LocationModel.countDocuments(filter);

    return {
      data: locations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: Partial<ILocation>) {
    const isExist = await LocationModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Location not found.");
    }
    if (data?.name) {
      const isNameExist = await LocationModel.findOne({
        name: data.name,
        _id: { $ne: id },
      });
      if (isNameExist) {
        throw new ApiError(
          HttpStatusCode.CONFLICT,
          "This location name already exists. Please use a different name."
        );
      }
      data.slug = SlugifyService.generateSlug(data.name);
    }

    const updateData = this.flatten(data);
    await LocationModel.findByIdAndUpdate(id, updateData);
  }

  async remove(id: string) {
    const location = await LocationModel.findById(id);
    if (!location) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Location not found");
    }

    await LocationModel.findByIdAndDelete(id);
  }

  private flatten(obj: any, prefix = ""): any {
    return Object.keys(obj).reduce((acc: any, key) => {
      const pre = prefix.length ? prefix + "." : "";
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        Object.assign(acc, this.flatten(obj[key], pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  }
}

export const LocationService = new Service();
