import { Types } from "mongoose";
import { IBanner } from "./banner.interface";
import { BannerModel } from "./banner.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { emitter } from "@/events/eventEmitter";

class Service {
  async create(data: IBanner) {
    return await BannerModel.create(data);
  }

  // this is for admin
  async getAllBanners(type: "normal" | "featured") {
    const queries: any = {};
    if (type) {
      queries.type = type;
    }
    return await BannerModel.find(queries).populate(
      "products",
      "name slug sku thumbnail"
    );
  }

  // this is for public. Only those banner have products
  async getAvailableBanners(type: "normal" | "featured") {
    // if products length < 1
    const queries: any = {
      "products.0": { $exists: true },
    };
    if (type) {
      queries.type = type;
    }
    return await BannerModel.find(queries).populate(
      "products",
      "name slug sku thumbnail"
    );
  }

  async updateBanner(id: Types.ObjectId, data: Partial<IBanner>) {
    const isExist = await BannerModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Banner not found");
    }
    if (data?.thumbnail !== isExist.thumbnail) {
      console.log("Banner thumbnail updated");
      // fire an event to delete the old thumbnail from AWS
      emitter.emit("s3.file.deleted", isExist.thumbnail);
    } else {
      console.log("Banner thumbnail not updated");
    }

    return await BannerModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteBanner(id: Types.ObjectId) {
    const isExist = await BannerModel.findById(id);
    if (!isExist) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Banner not found");
    }

    await BannerModel.findByIdAndDelete(id);
    if (isExist.thumbnail) {
      // delete the file from AWS
      emitter.emit("s3.file.deleted", isExist.thumbnail);
    }
  }
}

export const BannerService = new Service();
