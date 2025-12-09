import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { API_BASE_URL } from "@/config"
import Cookies from "js-cookie"
import { ProductsResponse } from "@/types/product"

const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
    headers: {
      Authorization: Cookies.get("cbd_atkn_91f2a") ?? "",
      ["x-refresh-token"]: Cookies.get("cbd_rtkn_7c4d1") ?? "",
      "Content-Type": "application/json",
    },
  }),
  reducerPath: "api",
  tagTypes: ["Product" , "User" , "Order", "Payment"],
  endpoints: (builder) => ({
    getUserInfo: builder.query({
      query: () => ({
        url: `/user/auth`,
        cache: "no-store",
      }),
      providesTags: ["User"],
    }),

    getProducts: builder.query<
      ProductsResponse,
      {
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: "asc" | "desc"
        search_query?: string
        stock?: "in" | "out"
        category?: string
        subcategory?: string
        min_price?: number
        max_price?: number
        tags?: string[]
        color?: string
        size?: string
        offerTags?: string
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        search_query,
        stock,
        category,
        subcategory,
        min_price,
        max_price,
        tags,
        color,
        size,
        offerTags,
      }) => {
        const params = new URLSearchParams()

        params.append("page", String(page))
        params.append("limit", String(limit))
        params.append("sortBy", sortBy)
        params.append("sortOrder", sortOrder)

        if (search_query) params.append("search_query", search_query)
        if (stock) params.append("stock", stock)
        if (category) params.append("category", category) // <- category id or slug supported
        if (subcategory) params.append("subcategory", subcategory)
        if (min_price !== undefined) params.append("min_price", String(min_price))
        if (max_price !== undefined) params.append("max_price", String(max_price))
        if (tags?.length) tags.forEach((tag) => params.append("tags", tag))
        if (color) params.append("color", color)
        if (size) params.append("size", size)
        if (offerTags) params.append("offerTags", offerTags) // <-- keep this key consistent

        return {
          url: `/product/published?${params.toString()}`,
          cache: "no-store",
        }
      },
      providesTags: ["Product"],
      transformResponse: (response: ProductsResponse) => {
        if (!response.data || !Array.isArray(response.data.data)) {
          console.error("Invalid products response structure:", response)
          return {
            ...response,
            data: {
              meta: response.data?.meta || { page: 1, limit: 0, total: 0 },
              data: [],
            },
          }
        }
        return response
      },
    }),

    getProductById: builder.query({
      query: (id: string) => ({
        url: `/product/${id}`,
        cache: "no-store",
      }),
    }),

    getProductsByIds: builder.query<ProductsResponse, string[]>({
      query: (ids) => {
        const qs = ids.join(",")
        return { url: `/product/by-ids?ids=${qs}`, cache: "no-store" }
      },
    }),

    getProductBySlug: builder.query({
      query: (slug: string) => ({
        url: `/product/slug/${slug}`,
        cache: "no-store",
      }),
    }),

    getAllSubCategories: builder.query({
      query: () => ({
        url: `/subcategory/available`,
        cache: "no-store",
      }),
    }),
    getBannerQuery: builder.query<any, void>({
      query: () => ({
        url: '/banner/available',
        method: 'GET'
      })
    })
  }),
})

export const {
  useGetUserInfoQuery,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetAllSubCategoriesQuery,
  useGetProductBySlugQuery,
  useGetProductsByIdsQuery,
  useGetBannerQueryQuery
} = api
export default api
