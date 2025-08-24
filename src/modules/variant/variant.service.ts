import { BarcodeService } from "@/lib/barcode";
import { IVariant } from "./variant.interface";
import { VariantModel } from "./variant.model";
import mongoose, { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

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

  async updateOne(id: Types.ObjectId, data: Partial<IVariant>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid variant ID.");
    }

    const existingVariant = await VariantModel.findById(id);
    if (!existingVariant) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Variant not found.");
    }

    if (data.attributes) {
      if (!Array.isArray(data.attributes) || data.attributes.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Attributes must be a non-empty array of strings."
        );
      }
      if (
        !data.attributes.every(
          (attr) => typeof attr === "string" && attr.trim().length > 0
        )
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Each attribute must be a non-empty string."
        );
      }
    }

    if (data.attribute_values) {
      if (
        !(data.attribute_values instanceof Map) &&
        typeof data.attribute_values !== "object"
      ) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "attribute_values must be a valid object/map."
        );
      }
      for (const [key, value] of Object.entries(
        data.attribute_values as Record<string, string>
      )) {
        if (
          !key ||
          typeof key !== "string" ||
          !value ||
          typeof value !== "string"
        ) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "attribute_values must have non-empty string keys and values."
          );
        }
      }
    }

    if (data.sku && data.sku.trim() !== existingVariant.sku) {
      const skuExists = await VariantModel.findOne({
        sku: data.sku.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (skuExists) {
        throw new ApiError(HttpStatusCode.CONFLICT, "SKU already exists.");
      }
    }

    const updatePayload: Partial<IVariant> = {
      ...data,
      sku: data.sku ?? existingVariant.sku,
    };

    const updatedVariant = await VariantModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    return updatedVariant;
  }

  async updateMany(variants: Partial<IVariant>[]) {
    const updates = variants.map((variant) => {
      if (!variant._id || !Types.ObjectId.isValid(variant._id)) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Each variant must have a valid _id for update."
        );
      }
      return this.updateOne(variant._id, variant);
    });

    return await Promise.all(updates);
  }
}

export const VariantService = new Service();
