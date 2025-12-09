import { API_BASE_URL } from "@/config"
import type { ApiResponse } from "@/types"

export interface FetchProductsParams {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
    category?: string
    search?: string
    searchQuery?: string
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<ApiResponse> {
    const { page = 1, limit = 10, sortBy = "price", sortOrder = "asc", category, searchQuery } = params

    const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
    })

    if (category) searchParams.append("category", category)
    if (searchQuery) searchParams.append("searchQuery", searchQuery)

    try {
        console.log(API_BASE_URL , 'HEe')
        const response = await fetch(`${API_BASE_URL}/product?${searchParams.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: ApiResponse = await response.json()
        return data
    } catch (error) {
        console.error("Error fetching products:", error)
        throw error
    }
}

export async function searchProducts(query: string, limit = 6): Promise<ApiResponse> {
    return fetchProducts({
        searchQuery: query,
        limit,
        page: 1,
    })
}