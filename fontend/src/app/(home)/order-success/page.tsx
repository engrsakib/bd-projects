"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Home, ShoppingBag, CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useCreatePaymentMutation } from "@/redux/api/order-query"
import { useAppDispatch } from "@/redux/store"
import { clearCart } from "@/redux/features/cart-slice"

interface OrderData {
    _id: string
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

export default function OrderSuccessPage() {
    const router = useRouter()
    const [orderData, setOrderData] = useState<OrderData | null>(null)
    const dispatch = useAppDispatch();

    const [createPayment, { isLoading: isProcessingPayment }] = useCreatePaymentMutation()

    useEffect(() => {

        dispatch(clearCart())

        const savedOrder = localStorage.getItem("lastOrder")
        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder)
                setOrderData(parsedOrder)

                localStorage.removeItem("lastOrder")
            } catch (error) {
                console.error("Error parsing order data:", error)
                // router.push("/")
            }
        } else {

            // router.push("/")
        }


    }, [router, dispatch])

    const handlePayNow = async () => {
        if (!orderData || orderData.payable_amount <= 0) return

        try {
            const paymentData = {
                total_amount: orderData.payable_amount,
                invoice_id: orderData.invoice_number,
                order_id: orderData._id,
            }


            const result = await createPayment(paymentData).unwrap()

            if (result.bkashURL) {

                window.open(result.bkashURL, "_blank")
                toast.success("Payment window opened. Complete your payment there.")
            } else {
                throw new Error("Payment URL not received")
            }
        } catch (error: any) {
            console.error("Payment error:", error)


            if (error?.data?.message) {
                toast.error(error.data.message)
            } else if (error?.message) {
                toast.error(error.message)
            } else {
                toast.error("Payment initialization failed. Please try again.")
            }
        }
    }

    if (!orderData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen bg-gray-50 flex items-center justify-center p-4"

        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl w-full bg-white rounded-2xl  p-8"
            >

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    lang="bn"
                    className="text-center mb-6"
                >
                    <h1 className="text-2xl font-bold text-secondary mb-2">অর্ডার সফল হয়েছে!</h1>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Placed Successfully!</h2>
                    <p className="text-gray-600">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                </motion.div>

                {/* Order Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3"
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Order ID:</span>
                        <span className="font-semibold text-secondary">#{orderData.order_serial_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Invoice:</span>
                        <span className="font-medium">{orderData.invoice_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Customer:</span>
                        <span className="font-medium">{orderData.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="font-medium">{orderData.customer_phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="font-bold text-secondary">Tk {orderData.total_amount.toLocaleString()}</span>
                    </div>
                    {orderData.payment_type === "CASH_ON_DELIVERY" && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Cash on Delivery:</span>
                            <span className="font-bold text-green-600">Tk {orderData.COD.toLocaleString()}</span>
                        </div>
                    )}
                    {orderData.payable_amount > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Payable Now:</span>
                            <span className="font-bold text-red-600">Tk {orderData.payable_amount.toLocaleString()}</span>
                        </div>
                    )}
                </motion.div>

                {/* Delivery Address */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-blue-50 rounded-lg p-4 mb-6"
                >
                    <h3 className="font-semibold text-secondary mb-2">Delivery Address:</h3>
                    <p className="text-sm text-gray-700">
                        {orderData.delivery_address.address}
                        <br />
                        {orderData.delivery_address.thana}, {orderData.delivery_address.district}
                        <br />
                        {orderData.delivery_address.division}
                    </p>
                </motion.div>

                {/* Products */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-6"
                >
                    <h3 className="font-semibold text-secondary mb-3">Ordered Items:</h3>
                    <div className="space-y-2">
                        {orderData.products.map((product, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium">Qty: {product.total_quantity}</span>
                                    {product.selected_variant.attribute_values.Size && (
                                        <span className="text-gray-500 ml-2">Size: {product.selected_variant.attribute_values.Size}</span>
                                    )}
                                    {product.selected_variant.attribute_values.Color && (
                                        <span className="text-gray-500 ml-2">Color: {product.selected_variant.attribute_values.Color}</span>
                                    )}
                                </div>
                                <span className="font-medium">Tk {product.total_price.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Payment Button */}
                {orderData.payable_amount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mb-6"
                    >
                        <button
                            onClick={handlePayNow}
                            disabled={isProcessingPayment}
                            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessingPayment ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Pay Now Tk {orderData.payable_amount.toLocaleString()}
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-2 gap-2"
                >
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Continue Shopping
                    </button>
                    <button
                        onClick={() => router.push("/orders")}
                        className="w-full border border-secondary text-secondary py-3 rounded-lg font-medium hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        View Orders
                    </button>
                </motion.div>
            </motion.div>
        </div>
    )
}
