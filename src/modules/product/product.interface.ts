import { Types } from "mongoose";
import { IVariant } from "../variant/variant.interface";

export type ISocialLink = {
  name: string;
  url: string;
};

export type IProductSaleChannels = {
  pos: boolean;
  website: boolean;
};

export type IOrderTypes = "standard" | "pre_order";
export enum OrderTypes {
  STANDARD = "standard",
  PRE_ORDER = "pre_order",
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  sku: string;

  thumbnail: string;
  slider_images?: string[];

  // Category Reference
  category: Types.ObjectId;
  subcategory: Types.ObjectId;
  variants: Types.ObjectId[] | IVariant[];
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

  // pre order
  is_pre_order?: boolean;

  // ratings
  ratings: {
    total: number;
    average: number;
  };
}

export interface ICreateProductPayload extends IProduct {
  variants: IVariant[];
  attributes: string[];
}

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
  is_published?: boolean;
  location?: string;
  sku?: string;
};
