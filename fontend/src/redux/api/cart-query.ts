"use client"

import api from "./api-query"

export type CartAttributes = { size?: string; color?: string;[k: string]: string | undefined }

export type AddToCartBody = {
  product: string
  variant: string
  attributes: CartAttributes
  quantity: number
  price: number
}

export type CartAddResponse = {
  success: boolean
  message?: string
  data?: unknown
}

export type CartItem = {
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
  attributes: CartAttributes
  quantity: number
  price: number
  createdAt: string
  updatedAt: string
  id: string
}

export type GetCartResponse = {
  statusCode: number
  success: boolean
  message: string
  data: {
    _id: string
    user: string
    total_price: number
    items: CartItem[]
    createdAt: string
    updatedAt: string
    id: string
  }
}

export type UpdateCartBody = {
  product: string
  variant: string
  attributes: CartAttributes
  quantity: number
  price: number
}

const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    addToCart: builder.mutation<CartAddResponse, AddToCartBody>({
      query: (body) => ({
        url: "/cart",
        method: "POST",
        body,
      }),
    }),
    getCart: builder.query<GetCartResponse, void>({
      query: () => ({
        url: "/cart/me",
        method: "GET",
      }),
    }),
    updateCartItem: builder.mutation<CartAddResponse, { id: string; body: UpdateCartBody }>({
      query: ({ id, body }) => ({
        url: `/cart/${id}`,
        method: "PATCH",
        body,
      }),
    }),
    removeCartItem: builder.mutation<CartAddResponse, string>({
      query: (id) => ({
        url: `/cart/${id}`,
        method: "DELETE",
      }),
    }),
    getStock: builder.query({
      query: ({ variant, productId }: { variant: string; productId: string }) => ({
        url: `/stocks/${variant}/${productId}`,
        cache: "no-store",
      }),
    })
  }),
  overrideExisting: false,
})

export const { useAddToCartMutation, useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation, useGetStockQuery , 
 } = cartApi
export default cartApi
