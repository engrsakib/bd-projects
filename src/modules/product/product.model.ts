import { model, Schema } from "mongoose";
import { IProduct, ISocialLink, IVariant } from "./product.interface";
import { schemaOptions } from "@/utils/schemaOptions";

const variantSchema = new Schema<IVariant>(
  {
    attributes: { type: [String], required: true },
    attribute_values: { type: Map, of: String, required: true },
    regular_price: { type: Number, required: true },
    sale_price: { type: Number, required: true },
    buying_price: { type: Number, default: 0 },
    sku: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: { type: String },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
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
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, required: true },

    thumbnail: { type: String, required: true },
    slider_images: { type: [String], default: [] },

    // ===== Category Info =====
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
    },

    variants: { type: [variantSchema], default: [] },

    // Stock & Order Constraints
    min_order_qty: { type: Number, default: 0 },
    max_order_qty: { type: Number, default: 0 },
    total_sold: { type: Number, default: 0 },

    // ===== Delivery Info =====
    approximately_delivery_time: { type: String, default: "" },
    is_free_delivery: { type: Boolean, default: false },
    coin_per_order: { type: Number, default: 0 },
    shipping_cost: { type: Number, default: 0 },
    shipping_cost_per_unit: { type: Number, default: 0 },

    // policy
    warranty: { type: String, default: "" },
    return_policy: { type: String, default: "" },

    // ===== Search & Offers =====
    search_tags: { type: [String], default: [] },
    offer_tags: { type: [String], default: [] },

    // ===== Social Links =====
    social_links: { type: [socialLinkSchema], default: [] },

    // Visibility
    is_published: { type: Boolean, default: false },
  },
  schemaOptions
);

export const ProductModel = model<IProduct>("Product", productSchema);
