import { model, Schema } from "mongoose";
import { ISubcategory } from "./subcategory.interface";
import { schemaOptions } from "@/utils/schemaOptions";
import { CategoryModel } from "../category/category.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

const subcategoriesSchema = new Schema<ISubcategory>(
  {
    name: {
      type: String,
      required: true,
      index: true,
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    serial: {
      type: Number,
      default: 0,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    products: { type: [Schema.Types.ObjectId], default: [] },
  },
  schemaOptions
);

// Add newly created subcategory ID to parent category
subcategoriesSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  try {
    await CategoryModel.findByIdAndUpdate(
      this.category,
      { $addToSet: { subcategories: this._id } },
      { new: true }
    );
    next();
  } catch (err) {
    next(
      new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Couldn't add sub category to parent category"
      )
    );
  }
});

export const SubcategoryModel = model<ISubcategory>(
  "Subcategory",
  subcategoriesSchema
);
