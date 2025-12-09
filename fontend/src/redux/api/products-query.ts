import api from "./api-query";

const productsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        searchProducts: builder.query({
            query: (text: string) => ({
                url: `/product/get-by-slug-title?slug=${text}&page=1&limit=10`,
                cache: "no-store",
            })
        }),
        getRelatedProducts: builder.query({
            query: (subcategoryId: string) => ({
                url: '/product/related/' + subcategoryId,
                cache: "no-store",
            })
        })
    })
})

export const { useSearchProductsQuery , useGetRelatedProductsQuery } = productsApi;
export default productsApi;