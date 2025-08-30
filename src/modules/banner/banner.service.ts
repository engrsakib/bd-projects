import { IBanner } from "./banner.interface";
import { BannerModel } from "./banner.model";

class Service {
  async create(data: IBanner) {
    return await BannerModel.create(data);
  }
}

export const BannerService = new Service();
