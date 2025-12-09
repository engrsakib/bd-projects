import { Category } from "."

export interface ProductVariant {
    _id: string
    attributes: string[]
    attribute_values: {
        Size: string
        Color: string
    }
    regular_price: number
    sale_price: number
    buying_price: number
    sku: string
    barcode: string
    image: string
    product: string
}


export interface Subcategory {
    _id: string
    name: string
    description: string
    slug: string
    category: string
    status: string
}
 
export interface Product {
    _id: string
    name: string
    slug: string
    description: string
    thumbnail: string
    category: Category
    subcategory: Subcategory
    min_order_qty: number
    max_order_qty: number
    total_sold: number
    approximately_delivery_time: string
    is_free_delivery: boolean
    coin_per_order: number
    shipping_cost: number
    warranty: string
    return_policy: string
    search_tags: string[]
    offer_tags: string[]
    is_published: boolean
    variants: ProductVariant[]
}

export interface ProductsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: ProductListResponse;
}


export interface Meta {
  page: number;
  limit: number;
  total: number;
  offer_tags: string[],
  max_price: number
  min_price:number
}

export interface ProductListResponse {
  meta: Meta;
  data: Product[];
}