
export interface SubCategory {
  _id: string;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  image_url: string;
  position: number;
  slug: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface SubCategoryApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: SubCategory[];
}

export interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    meta: {
      page: number;
      limit: number;
      total: number;
    };
    data: Product[];
  };
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  min_order_qty: number;
  max_order_qty: number;
  total_sold: number;
  approximately_delivery_time: string;
  is_free_delivery: boolean;
  coin_per_order: number;
  shipping_cost: number;
  shipping_cost_per_unit: number;
  warranty: string;
  return_policy: string;
  total_rating: number;
  search_tags: string[];
  offer_tags: string[];
  category: Category;
  subcategory?: Subcategory;
  is_published: boolean;
  reviews: any[];
  createdAt: string;
  updatedAt: string;
  attributes: string[];
  variants: Variant[];
}

export interface Category {
  _id: string;
  name: string;
  image: string;
  slug: string;
  serial: number;
  status: "pending_approval" | "approved" | "rejected" | string; // extendable
  created_by: string;
  subcategories: string[];
  products: string[]; // can be string[] or a more detailed type if needed
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
}



export interface ProductInfo {
  _id: string
  name: string
  slug: string
  sku: string
  description: string
  thumbnail: string
  id: string
}

export interface VariantInfo {
  _id: string
  attributes: string[]
  attribute_values: Record<string, string>
  regular_price: number
  sale_price: number
  sku: string
  barcode: string
  image?: string | null
  id: string
}

export interface OrderProduct {
  product: ProductInfo
  variant: VariantInfo
  attributes: Record<string, string>
  quantity: number
  lots: Array<{
    lotId: string
    deducted: number
    _id: string
  }>
  price: number
  subtotal: number
  status: string
  _id: string
}

export interface OrderData {
  order_status: string
  order_id: number
  product: OrderProduct[]
  invoice_number: string
  payment_status: string
  payment_type: string
  total_amount: number
  order_at: string
}

export interface OrderTrackingResponse {
  success: boolean
  data: OrderData
}
// Optional: enums you shared (kept for reference / strengthening TS where helpful)
export enum ORDER_STATUS {
  PENDING = "pending",
  FAILED = "failed",
  PLACED = "placed",
  ACCEPTED = "accepted",
  SHIPPED = "shipped",
  HANDED_OVER_TO_COURIER = "handed_over_to_courier",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  PENDING_RETURN = "pending_return",
  RETURNED = "returned",
  CANCELLED = "cancelled",
  EXCHANGE_REQUESTED = "exchange_requested",
  EXCHANGED = "exchanged",
  PARTIAL_DELIVERED = "partial_delivered",
}

export enum PAYMENT_STATUS {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PAYMENT_METHOD {
  BKASH = "bkash",
  COD = "cod",
}

export interface Subcategory {
  _id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  description_en: string;
  description_bn: string;
  position: number;
  image_url: string;
  category: string;
}

export interface Variant {
  attribute_values: Record<string, string>;
  regular_price: number;
  sale_price: number;
  sku: string;
  available_quantity: number;
  image: string | null;
}

export interface CartItem {
  id: string;
  product: ProductForCart;
  quantity: number;
  selectedSize?: number;
  selectedColor?: string;
  selectedVariant?: Variant;
}

export interface ProductForCart {
  sku: string;
  name: string;
  img: string;
  priceDiscount: number;
  priceRegular: number;
  rating: number;
  reviews: number;
  brand: string;
  availableSizes?: number[];
}

export function convertToCartProduct(
  product: Product,
  selectedVariant: Variant
): ProductForCart {
  return {
    sku: selectedVariant.sku,
    name: product?.name || "product name not found".replace(/<[^>]*>/g, ""),
    img: product?.thumbnail,
    priceDiscount: selectedVariant.sale_price,
    priceRegular: selectedVariant.regular_price,
    rating: product.total_rating,
    reviews: product.total_sold,
    brand: product?.category?.name || "Unknown",
    availableSizes: product.variants
      .filter((v) => v.attribute_values.Size)
      .map((v) => Number.parseInt(v.attribute_values.Size))
      .filter((size) => !isNaN(size)),
  };
}
