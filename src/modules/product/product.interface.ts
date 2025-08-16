import { Types } from "mongoose";

export type IVariantCombination = {
  attribute_values: {
    [key: string]: string;
  };
  sale_price: number;
  regular_price: number;
  sku: string;
  barcode: string; // auto-generated
  available_quantity: number;
  image: string;
};

export type ISocialLink = {
  name: string;
  url: string;
};

export type IProduct = {
  // ===== Basic Info =====
  name: string;
  slug: string;
  thumbnail: string;
  slider_images: string[];
  description: string;
  brand: string;
  sku: string;
  is_published: boolean;

  // ===== Category Info =====
  category: Types.ObjectId;
  subcategory: Types.ObjectId;

  created_by: Types.ObjectId;

  // ===== Pricing =====
  sale_price: number;
  regular_price: number;

  // ===== Inventory =====
  inventory: {
    total_quantity: number;
    current_stock_qty: number;
    total_sold: number;
    min_order_qty: number;
    max_order_qty: number;
  };

  // ===== Delivery Info =====
  delivery: {
    shipping_charge: number;
    approximate_delivery_time: string;
    warranty?: string;
    return_policy?: string;
    is_free_delivery: boolean;
  };

  // ===== Variants & Attributes =====
  attributes?: string[];
  variants?: IVariantCombination[];

  // ===== Search & Offers =====
  search_tags: string[];
  offer_tags: string[];

  // ===== Social Links =====
  social_links: ISocialLink[];

  // ===== Ratings =====
  ratings: {
    total: number;
    average: number;
  };
};
