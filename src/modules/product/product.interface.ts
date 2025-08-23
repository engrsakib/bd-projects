import { Types, Document } from "mongoose";
import { IVariant } from "../variant/variant.interface";

export type ISocialLink = {
  name: string;
  url: string;
};

export type IProduct = {
  // Basic Info
  name: string;
  slug: string;
  description: string;
  sku: string;

  // Images
  thumbnail: string;
  slider_images?: string[];

  // Category Reference
  category: Types.ObjectId;
  subcategory: Types.ObjectId;
  variants?: Types.ObjectId[] | IVariant[];
  sale_channels: { pos: boolean; website: boolean };

  // Stock & Order Constraints
  min_order_qty?: number;
  max_order_qty?: number;
  total_sold?: number;

  // Delivery & Offers
  approximately_delivery_time: string;
  is_free_delivery?: boolean;
  coin_per_order?: number;
  shipping_cost?: number;
  shipping_cost_per_unit?: number;

  // Policy
  warranty?: string;
  return_policy?: string;

  // Tags
  search_tags?: string[];
  offer_tags?: string[];

  // Social Links
  social_links?: ISocialLink[];

  // Visibility
  is_published?: boolean;

  // ratings
  ratings: {
    total: number;
    average: number;
  };
} & Document;

export type IProductFilters = {
  stock?: "in" | "out";
  category?: string;
  subcategory?: string;
  search_query?: string;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  color?: string;
  size?: string;
};
