import { API_BASE_URL } from "@/config"
import { OrderTrackingResponse } from "@/types"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import api from "./api-query"

export interface CreateOrderRequest {
    order_by: "GUEST" | "CUSTOMER"
    customer_name: string
    customer_phone: string
    payment_type: "CASH_ON_DELIVERY" | "FULL_PAYMENT"
    sub_total: number
    total_discount: number
    delivery_charge: number
    total_amount: number
    payable_amount: number
    COD: number
    paid_amount: number
    products: Array<{
        product: string
        product_name: string
        total_quantity: number
        total_price: number
        discount_type: "PERCENTAGE" | "FLAT"
        discount_amount: number
        total_discount: number
        shipping_cost: number
        shipping_cost_per_unit: number
        total_shipping_cost: number
        is_free_delivery: boolean
        coin_per_order: number
        selected_variant: {
            attribute_values: Record<string, string>
            sku: string
        }
    }>
    is_delivery_charge_paid: boolean
    delivery_address: {
        division: string
        district: string
        thana: string
        address: string
    }
}

export interface CreateOrderResponse {
    statusCode: number
    success: boolean
    message: string
    data: {
        _id: string
        bkashURL: string
        order_serial_id: number
        invoice_number: string
        customer_name: string
        customer_phone: string
        total_amount: number
        payable_amount: number
        COD: number
        payment_type: string
        delivery_address: {
            division: string
            district: string
            thana: string
            address: string
        }
        products: Array<{
            product: string
            total_quantity: number
            total_price: number
            selected_variant: {
                attribute_values: Record<string, string>
                sku: string
            }
        }>
        order_date: string
        status: string
    }
}

export interface CreatePaymentRequest {
    total_amount: number
    invoice_id: string
    order_id: string
}

export interface CreatePaymentResponse {
    bkashURL: string
}



export interface Order {
    _id: string
    order_id: number
    invoice_number: string
    customer_name: string
    customer_number: string
    total_amount: number
    order_status: string
    order_at: string
    items: Array<{
        product: {
            name: string
            thumbnail: string
        }
        quantity: number
        price: number
    }>
}

interface MyOrderApiResponse {
    statusCode: number
    success: boolean
    message: string
    data: Order[]
}


const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
            query: (orderData) => ({
                url: "/order",
                method: "POST",
                body: orderData,
            }),
            invalidatesTags: ["Order"],
        }),
        createPayment: builder.mutation<CreatePaymentResponse, CreatePaymentRequest>({
            query: (paymentData) => ({
                url: "/payment/create",
                method: "POST",
                body: paymentData,
            }),
            invalidatesTags: ["Payment"],
        }),
        getOrderById: builder.query<CreateOrderResponse, string>({
            query: (orderId) => ({
                url: `/order/${orderId}`,
                cache: "no-store",
            }),
            providesTags: (result, error, orderId) => [{ type: "Order", id: orderId }],
        }),
        getOrderTracking: builder.query<OrderTrackingResponse, string>({
            query: (invoiceId: string) => ({
                url: `/order/orders/track/${invoiceId}`,
                cache: "no-store",
            }),
        }),

        getMyOrders: builder.query<MyOrderApiResponse, void>({
            query: () => ({
                url: `/order/user`,
                cache: "no-store",
            }),
            providesTags: ["Order"],
        }),
    }),
})

export const {
    useCreateOrderMutation,
    useCreatePaymentMutation,
    useGetOrderByIdQuery,
    useGetOrderTrackingQuery,
    useGetMyOrdersQuery
} = orderApi

export default orderApi
