import { model, Schema } from "mongoose";
import { IProduct, ISocialLink } from "./product.interface";
import { schemaOptions } from "@/utils/schemaOptions";

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
    description: { type: String, required: true },

    thumbnail: { type: String, required: true },
    slider_images: { type: [String], default: [] },

    // ===== Category Info =====
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
    },

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
