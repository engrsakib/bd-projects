import { IBanner } from "./banner.interface";
import { BannerModel } from "./banner.model";

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
}

export const BannerService = new Service();
