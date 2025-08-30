import { IBanner } from "./banner.interface";
import { BannerModel } from "./banner.model";

class Service {
  async create(data: IBanner) {
    return await BannerModel.create(data);
  }

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
}

export const BannerService = new Service();
