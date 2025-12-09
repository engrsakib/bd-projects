export interface CartItem {
  _id: string
  product: {
    _id: string
    name: string
    slug: string
    sku: string
    thumbnail: string
    id: string
  }
  variant: string
  attributes: {
    size: string
    color: string
  }
  quantity: number
  price: number
  createdAt: string
  updatedAt: string
  id: string
}

export interface Cart {
  _id: string
  user: string
  total_price: number
  items: CartItem[]
  createdAt: string
  updatedAt: string
  id: string
}

export interface CartResponse {
  statusCode: number
  success: boolean
  message: string
  data: Cart
}
