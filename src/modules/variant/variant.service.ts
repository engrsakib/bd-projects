import { BarcodeService } from "@/lib/barcode";
import { IVariant } from "./variant.interface";
import { VariantModel } from "./variant.model";
import mongoose from "mongoose";

class Service {
  async createOne(
    data: IVariant,
    session?: mongoose.mongo.ClientSession
  ): Promise<IVariant> {
    data.barcode = BarcodeService.generateEAN13();
    if (session) {
      const [variant] = await VariantModel.create([data], { session });
      return variant.toObject();
    }
    const [variant] = await VariantModel.create([data]);
    return variant.toObject();
  }

  async createMany(
    data: IVariant[],
    session?: mongoose.mongo.ClientSession
  ): Promise<IVariant[]> {
    data.forEach((item) => {
      item.barcode = BarcodeService.generateEAN13();
    });
    if (session) {
      const variants = await VariantModel.insertMany(data, { session });
      return variants.map((variant) => variant.toObject());
    }
    const variants = await VariantModel.insertMany(data);
    return variants.map((variant) => variant.toObject());
  }
}

export const VariantService = new Service();
