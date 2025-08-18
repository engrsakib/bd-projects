import ApiError from "@/middlewares/error";
import { IProduct } from "./product.interface";
import { ProductModel } from "./product.model";
import { HttpStatusCode } from "@/lib/httpStatus";
import { SlugifyService } from "@/lib/slugify";

class Service {
  async create(data: IProduct) {
    const isExist = await ProductModel.findOne({ name: data.name });
    if (isExist) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "Product already exist with this name. Please choose a different name."
      );
    }

    // generate slug from name
    data.slug = SlugifyService.generateSlug(data.name);

    await ProductModel.create(data);
  }
}

export const ProductService = new Service();
