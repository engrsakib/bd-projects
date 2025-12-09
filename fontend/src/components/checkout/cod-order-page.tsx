"use client"

import {
    CheckCircle,
    Package,
    MapPin,
    Copy,
    ArrowRight,
    Truck,
    CreditCard,
    Calendar,
    Phone,
    AlertCircle,
    Receipt,
    Clock, // Added Clock for the Pre-order icon
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Container } from "../common/container"
import Link from "next/link"
import { useAppDispatch } from "@/redux/store"
import { useEffect } from "react"
import { clearCart } from "@/redux/features/cart-slice"

type OrderResponse = {
    statusCode: number
    success: boolean
    message: string
    data: {
        order: any[]
        payment_url?: string
    }
}

const CashOnDelivery = ({ orderResponse, isPreOrder }: { orderResponse: OrderResponse, isPreOrder?: boolean }) => {
    const order = orderResponse?.data?.order?.[0]
    const isSuccess = !!(orderResponse?.success && orderResponse?.statusCode === 201)

    const dispatch = useAppDispatch();


    const copyOrderId = () => {
        if (!order?.order_id) return
        navigator.clipboard.writeText(String(order.order_id))
    }

    const getStatusColor = (status?: string) => {
        switch ((status || "").toLowerCase()) {
            case "placed":
                return "bg-green-50 text-green-700 border-green-200"
            case "pending":
                return "bg-yellow-50 text-yellow-700 border-yellow-200"
            case "paid":
            case "success":
            case "completed":
            case "delivered":
                return "bg-green-50 text-green-700 border-green-200"
            case "shipped":
            case "processing":
                return "bg-blue-50 text-blue-700 border-blue-200"
            case "failed":
            case "canceled":
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200"
            default:
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }

    const StatusIcon = isSuccess ? CheckCircle : AlertCircle

    const addr = order?.delivery_address || {}
    const addressLines: string[] = []
    if (addr?.local_address) addressLines.push(addr.local_address)
    const line2Parts = [addr?.thana, addr?.district].filter(Boolean)
    if (line2Parts.length) addressLines.push(line2Parts.join(", "))
    if (addr?.division) addressLines.push(addr.division)
    if (addr?.zip_code) addressLines.push(String(addr.zip_code))

    const money = (n?: number) => (typeof n === "number" ? `TK ${n}` : "-")


    useEffect(() => {
        dispatch(clearCart())
    }, [dispatch])



    return (
        <div className="bg-gray-50">
            <Container className="py-4 sm:py-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-6 animate-fadeIn">
                    <div>
                        <h1 className="font-medium text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-2">
                            {isSuccess ? (
                                <>
                                    Order <span className="text-primary">Placed</span>
                                </>
                            ) : (
                                "Order Failed"
                            )}
                        </h1>
                    </div>

                    {/* --- PRE-ORDER UI INDICATOR START --- */}
                    {isPreOrder && isSuccess && (
                        <div className="flex flex-col items-center justify-center mb-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-white shadow-sm text-primary text-xs font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pre-Order Item</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1.5">
                                Note: This is a pre-order. Delivery timeline may vary.
                            </p>
                        </div>
                    )}
                    {/* --- PRE-ORDER UI INDICATOR END --- */}

                    {!isPreOrder && (
                         <p className="text-gray-600 text-sm sm:text-base mb-3">{orderResponse?.message}</p>
                    )}
                   

                    <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 mt-2">
                        <span className="text-xs text-gray-500">Order ID:</span>
                        <code className="text-xs text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">#{order?.order_id ?? "—"}</code>
                        {order?.order_id ? (
                            <Button variant="ghost" size="sm" onClick={copyOrderId} className="h-6 w-6 p-0">
                                <Copy className="w-3 h-3" />
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-3">
                        {/* Order Summary */}
                        <Card className="animate-fadeIn p-0 border-0 shadow-none">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-row sm:items-center justify-between mb-4 gap-3">
                                    <div>
                                        <h2 className="font-medium text-base sm:text-lg text-gray-900 mb-1">Order Summary</h2>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs text-gray-500">Invoice:</span>
                                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                                {order?.invoice_number ?? "—"}
                                            </code>
                                            <span className="text-xs text-gray-300">•</span>
                                            <span className="text-xs text-gray-500">Total items:</span>
                                            <span className="text-xs text-gray-900">{order?.total_items ?? order?.items?.length ?? 0}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-xl sm:text-2xl text-primary">{money(order?.total_amount)}</div>
                                        <div className="text-xs text-gray-500">Total Amount</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="flex flex-col md:flex-row items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                                            <StatusIcon className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500 mb-0.5">Order Status</div>
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] border ${getStatusColor(order?.order_status)}`}>
                                                {order?.order_status ?? "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                                        <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500 mb-0.5">Payment</div>
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] border ${getStatusColor(order?.payment_status)}`}>
                                                {order?.payment_status ?? "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row  items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                                        <div className="w-9 h-9 rounded-full bg-[#c460b5] flex items-center justify-center">
                                            <Truck className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-gray-500 mb-0.5">Payment Type</div>
                                            <div className="text-sm text-gray-900 text-center md:text-start uppercase">{order?.payment_type ?? "—"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Totals strip */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-gray-50 p-2.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">{money(order?.total_price)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-0.5">
                                            <span className="text-gray-600">Delivery Charge</span>
                                            <span className="font-medium">{money(order?.delivery_charge)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-0.5">
                                            <span className="text-gray-600">Paid</span>
                                            <span className="font-medium">{money(order?.paid_amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-0.5">
                                            <span className="text-gray-600">Payable</span>
                                            <span className="font-medium">{money(order?.payable_amount)}</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-2.5">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <Receipt className="w-4 h-4" />
                                            <span>Invoice</span>
                                        </div>
                                        <div className="text-sm mt-0.5 text-gray-900">{order?.invoice_number ?? "—"}</div>
                                        <div className="text-xs mt-1 text-gray-500">
                                            Delivery charge paid? <span className="font-medium">{order?.is_delivery_charge_paid ? "Yes" : "No"}</span>
                                        </div>
                                        <div className="text-xs mt-0.5 text-gray-500">
                                            Transfer to courier? <span className="font-medium">{order?.transfer_to_courier ? "Yes" : "No"}</span>
                                        </div>
                                        {order?.courier ? (
                                            <div className="text-xs mt-0.5 text-gray-500">
                                                Courier: <span className="font-medium">{String(order.courier)}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Product Details */}
                        <Card className="animate-fadeIn shadow-none p-0 border-0">
                            <CardContent className="p-3 sm:px-4">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-medium text-base text-gray-900">Order Items</h3>
                                </div>

                                {(order?.items ?? []).map((item: any, index: number) => (
                                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg mb-3 last:mb-0">
                                        <div className="relative flex-shrink-0">
                                            <Image
                                                src={item?.product?.thumbnail || "/placeholder.svg?height=80&width=80"}
                                                alt={item?.product?.name || "Product image"}
                                                width={80}
                                                height={80}
                                                className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover"
                                            />
                                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[11px] text-white">
                                                {item?.quantity ?? 1}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                                                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                                    {item?.product?.name ?? "Unnamed product"}
                                                </h4>
                                                
                                                {/* --- PRE-ORDER ITEM BADGE START --- */}
                                                {isPreOrder && (
                                                     <span className="text-[10px] font-semibold uppercase tracking-wide text-primary border border-primary/20 bg-white px-1.5 py-0.5 rounded">
                                                        Pre-Order
                                                     </span>
                                                )}
                                                {/* --- PRE-ORDER ITEM BADGE END --- */}
                                            </div>

                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                {Object.entries(item?.attributes || {}).map(([key, value]) => (
                                                    <span key={key} className="text-xs bg-white px-1.5 py-0.5 rounded text-gray-600">
                                                        {key}: {String(value)}
                                                    </span>
                                                ))}
                                            </div>

                                            {item?.variant?.sku ? (
                                                <p className="text-[11px] text-gray-500 mb-1">SKU: {item?.variant?.sku}</p>
                                            ) : null}

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Unit Price</span>
                                                <span className="font-medium text-primary text-sm sm:text-base">{money(item?.price)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <span className="text-xs text-gray-500">Subtotal</span>
                                                <span className="text-xs text-gray-900 font-medium">{money(item?.subtotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t border-gray-200 pt-3 mt-3 space-y-1.5">
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>Subtotal</span>
                                        <span>{money(order?.total_price)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>Delivery Charge</span>
                                        <span>{money(order?.delivery_charge)}</span>
                                    </div>
                                    <div className="flex justify-between text-base sm:text-lg pt-1.5 border-t border-gray-200">
                                        <span className="text-gray-900 font-medium">Total</span>
                                        <span className="font-medium text-primary">{money(order?.total_amount)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-3">
                        <Card className="animate-fadeIn border-0 shadow-none">
                            <CardContent className="p-3 sm:px-4 ">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-medium text-base text-gray-900">Delivery Details</h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs">👤</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 mb-0.5">Customer</div>
                                            <div className="text-sm text-gray-900 font-medium">{order?.customer_name ?? "—"}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Phone className="w-3 h-3 text-gray-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 mb-0.5">Phone</div>
                                            <div className="text-sm text-gray-900 font-medium">
                                                {order?.customer_number ?? "—"}
                                                {order?.customer_secondary_number ? `, ${order.customer_secondary_number}` : ""}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin className="w-3 h-3 text-gray-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 mb-0.5">Address</div>
                                            <div className="text-sm text-gray-900 leading-snug">
                                                {addressLines.length ? (
                                                    addressLines.map((l, i) => (
                                                        <div key={i}>
                                                            {l}
                                                            {i !== addressLines.length - 1 ? <br /> : null}
                                                        </div>
                                                    ))
                                                ) : (
                                                    "—"
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Calendar className="w-3 h-3 text-gray-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-gray-500 mb-0.5">Order Date</div>
                                            <div className="text-sm text-gray-900 font-medium">
                                                {order?.order_at
                                                    ? new Date(order.order_at).toLocaleString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </div>
                                        </div>
                                    </div>

                                    {(order?.order_note || order?.notes) && (
                                        <div className="pt-2.5 border-t border-gray-200">
                                            <div className="text-[11px] text-gray-500 mb-1.5">Notes</div>
                                            <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1.5 rounded break-words">
                                                {order?.order_note || order?.notes}
                                            </div>
                                        </div>
                                    )}

                                    {order?.payment_id ? (
                                        <div className="pt-2.5 border-t border-gray-200">
                                            <div className="text-[11px] text-gray-500 mb-1.5">Payment ID</div>
                                            <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1.5 rounded break-all">
                                                {order.payment_id}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col mt-4 gap-2.5">
                                    <Link href={'/track-order'} className="">
                                        <Button className="w-full bg-primary hover:bg-[#c460b5] text-white py-2 rounded-lg">
                                            Track Your Order
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                    <Link href={'/'}>
                                        <Button
                                            variant="outline"
                                            className="w-full py-2 rounded-lg border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                                        >
                                            Continue Shopping
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="text-center mt-6 p-4 bg-white rounded-lg animate-fadeIn">
                    <p className="text-gray-600 leading-snug">
                        You&apos;ll receive updates about your order via SMS.
                        <br />
                        <span className="text-primary font-medium">Thank you for shopping with us!</span>
                    </p>
                </div>
            </Container>
        </div>
    )
}

export default CashOnDelivery;