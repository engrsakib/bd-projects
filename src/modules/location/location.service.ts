import ApiError from "@/middlewares/error";
import { ILocation } from "./location.interface";
import { LocationModel } from "./location.model";
import { HttpStatusCode } from "@/lib/httpStatus";

class Service {
  async create(data: ILocation) {
    const isExist = await LocationModel.findOne({ name: data.name });
    if (!isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `This location: ${data.name} with type ${data?.type || "warehouse"} is already exist. Please enter a different name.`
      );
    }
    await LocationModel.create(data);
  }
}

export const LocationService = new Service();
