import { model, Schema } from "mongoose";
import {
  IProduct,
  IVariantCombination,
  ISocialLink,
} from "./product.interface";
import { schemaOptions } from "@/utils/schemaOptions";

// ===== Variant Combination Schema =====
const variantCombinationSchema = new Schema<IVariantCombination>(
  {
    attribute_values: { type: Map, of: String, required: true },
    sale_price: { type: Number, required: true },
    regular_price: { type: Number, required: true },
    sku: { type: String, required: true, trim: true },
    available_quantity: { type: Number, required: true },
    barcode: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  schemaOptions
);

// ===== Social Link Schema =====
const socialLinkSchema = new Schema<ISocialLink>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  schemaOptions
);

// ===== Product Schema =====
const productSchema = new Schema<IProduct>(
  {
    // ===== Basic Info =====
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    thumbnail: { type: String, required: true },
    slider_images: { type: [String], default: [] },
    description: { type: String, required: true },
    brand: { type: String, default: "" },
    sku: { type: String, required: true, trim: true },
    is_published: { type: Boolean, default: false },

    // ===== Category Info =====
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
    },

    created_by: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // ===== Pricing =====
    sale_price: { type: Number, required: true },
    regular_price: { type: Number, required: true },

    // ===== Inventory =====
    inventory: {
      total_quantity: { type: Number, required: true },
      current_stock_qty: { type: Number, required: true },
      total_sold: { type: Number, default: 0 },
      min_order_qty: { type: Number, default: 1 },
      max_order_qty: { type: Number, default: 1000 },
    },

    // ===== Delivery Info =====
    delivery: {
      shipping_charge: { type: Number, default: 0 },
      approximate_delivery_time: { type: String, default: "" },
      warranty: { type: String, default: "" },
      return_policy: { type: String, default: "" },
      is_free_delivery: { type: Boolean, default: false },
    },

    // ===== Variants & Attributes =====
    attributes: { type: [String], default: [] },
    variants: { type: [variantCombinationSchema], default: [] },

    // ===== Search & Offers =====
    search_tags: { type: [String], default: [] },
    offer_tags: { type: [String], default: [] },

    // ===== Social Links =====
    social_links: { type: [socialLinkSchema], default: [] },

    // ===== Ratings =====
    ratings: {
      total: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
    },
  },
  schemaOptions
);

export const ProductModel = model<IProduct>("Product", productSchema);
