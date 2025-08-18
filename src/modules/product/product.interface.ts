import { Types } from "mongoose";

export type ISocialLink = {
  name: string;
  url: string;
};

export type IProduct = {
  // Basic Info
  name: string;
  slug: string;
  description: string;

  // Images
  thumbnail: string;
  slider_images?: string[];

  // Category Reference
  category: Types.ObjectId;
  subcategory: Types.ObjectId;

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
  social_links?: ISocialLink;

  // Visibility
  is_published?: boolean;
};
