import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";
import { schemaOptions } from "@/utils/schemaOptions";
import { CATEGORY_STATUS_ENUM } from "./category.enums";

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    serial: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(CATEGORY_STATUS_ENUM),
      default: CATEGORY_STATUS_ENUM.PENDING_APPROVAL,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    subcategories: { type: [Schema.Types.ObjectId], default: [] },
    products: { type: [Schema.Types.ObjectId], default: [] },
  },
  schemaOptions
);

CategorySchema.virtual("subcategories_count").get(function () {
  return this.subcategories.length > 0 ? this.subcategories.length : 0;
});

CategorySchema.virtual("products_count").get(function () {
  return this.products.length > 0 ? this.products.length : 0;
});

export const CategoryModel = model("Category", CategorySchema);
