"use client"

import type React from "react"
import { useState } from "react"
import {
  Search,
  Package,
  CheckCircle,
  Truck,
  ShoppingBag,
  AlertCircle,
  Calendar,
  Info,
  ArrowRight,
  Box,
  Receipt,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Container } from "@/components/common/container"
import { useGetOrderTrackingQuery } from "@/redux/api/order-query"
import Image from "next/image"
import { ORDER_STATUS, type OrderTrackingResponse } from "@/types"
import { FaMoneyBill } from "react-icons/fa"

const OrderTracker = () => {
  const [trackingId, setTrackingId] = useState("")
  const [searchedId, setSearchedId] = useState("")

  const { data, error, isLoading, refetch } = useGetOrderTrackingQuery(searchedId, {
    skip: !searchedId,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingId.trim()) {
      setSearchedId(trackingId.trim())
    }
  }

  const handleTryAgain = () => {
    setSearchedId("")
    setTrackingId("")
    refetch()
  }

  const norm = (s?: string) => (s || "").toLowerCase() as string

  const orderSteps = [
    { id: 1, key: ORDER_STATUS.PENDING, name: "Pending", icon: <ShoppingBag className="h-5 w-5" /> },
    { id: 2, key: ORDER_STATUS.PLACED, name: "Placed", icon: <CheckCircle className="h-5 w-5" /> },
    { id: 3, key: ORDER_STATUS.ACCEPTED, name: "Accepted", icon: <CheckCircle className="h-5 w-5" /> },
    { id: 4, key: ORDER_STATUS.SHIPPED, name: "Shipped", icon: <Package className="h-5 w-5" /> },
    { id: 5, key: ORDER_STATUS.IN_TRANSIT, name: "In Transit", icon: <Truck className="h-5 w-5" /> },
    { id: 6, key: ORDER_STATUS.DELIVERED, name: "Delivered", icon: <CheckCircle className="h-5 w-5" /> },
  ]

  const stepForStatus = (status: string) => {
    const s = norm(status)
    switch (s) {
      case ORDER_STATUS.PENDING:
        return 1
      case ORDER_STATUS.PLACED:
        return 2
      case ORDER_STATUS.ACCEPTED:
        return 3
      case ORDER_STATUS.SHIPPED:
      case ORDER_STATUS.HANDED_OVER_TO_COURIER:
        return 4
      case ORDER_STATUS.IN_TRANSIT:
        return 5
      case ORDER_STATUS.DELIVERED:
        return 6
      case ORDER_STATUS.CANCELLED:
      case ORDER_STATUS.FAILED:
      case ORDER_STATUS.RETURNED:
        return 0 // special cases => no timeline
      default:
        return 1
    }
  }

  const getStatusDetails = (status: string) => {
    const s = norm(status)
    if (s === ORDER_STATUS.DELIVERED) {
      return {
        icon: <CheckCircle className="h-7 w-7 text-green-600" />,
        title: "Delivered",
        description: "Your order has been delivered successfully.",
        color: "bg-green-50",
        step: stepForStatus(s),
      }
    }
    if (s === ORDER_STATUS.SHIPPED || s === ORDER_STATUS.IN_TRANSIT) {
      return {
        icon: <Truck className="h-7 w-7 text-blue-600" />,
        title: s === ORDER_STATUS.SHIPPED ? "Shipped" : "In Transit",
        description: s === ORDER_STATUS.SHIPPED ? "Your order is with the courier." : "Your order is on the way.",
        color: "bg-blue-50",
        step: stepForStatus(s),
      }
    }
    if (s === ORDER_STATUS.CANCELLED || s === ORDER_STATUS.FAILED) {
      return {
        icon: <AlertCircle className="h-7 w-7 text-red-600" />,
        title: s === ORDER_STATUS.CANCELLED ? "Cancelled" : "Failed",
        description: "This order did not complete.",
        color: "bg-red-50",
        step: 0,
      }
    }
    return {
      icon: <ShoppingBag className="h-7 w-7 text-primary" />,
      title: s === ORDER_STATUS.PENDING ? "Pending" : "Processing",
      description: "We have your order and are getting it ready.",
      color: "bg-amber-50",
      step: stepForStatus(s),
    }
  }

  const formatDateTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "—"

  const renderOrderTimeline = (currentStep: number) => {
    if (currentStep === 0) return null
    const maxStep = orderSteps[orderSteps.length - 1].id
    return (
      <div className="mt-4 mb-3">
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-200">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (currentStep / maxStep) * 100)}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </div>
          {/* Steps */}
          <div className="relative flex justify-between">
            {orderSteps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <motion.div
                  className={`flex items-center justify-center w-8 h-8 rounded-full z-10 ${step.id <= currentStep ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: step.id === currentStep ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {step.icon}
                </motion.div>
                <p className={`mt-1 text-[11px] ${step.id <= currentStep ? "text-primary" : "text-gray-500"}`}>
                  {step.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderOrderStatus = () => {
    if (!searchedId) return null

    if (isLoading) {
      return (
        <div className="mt-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </motion.div>
          <p className="mt-2 text-gray-600 text-sm">Searching for your order...</p>
        </div>
      )
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-lg bg-red-50 border border-red-100"
        >
          <div className="flex flex-col items-center text-center">
            <div className="p-2.5 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-2 text-base font-medium text-red-800">Order Not Found</h3>
            <p className="mt-1 text-sm text-red-700">Please check your invoice number and try again.</p>
            <button
              onClick={handleTryAgain}
              className="mt-3 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </motion.div>
      )
    }

    const ok = (data as OrderTrackingResponse | undefined)?.success
    const payload = (data as OrderTrackingResponse | undefined)?.data

    if (ok && payload) {
      const statusDetails = getStatusDetails(payload.order_status)

      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-6"
          >
            {/* Status Card */}
            <div className={`p-4 rounded-lg ${statusDetails.color} border border-gray-200`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/60 rounded-full">{statusDetails.icon}</div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">{statusDetails.title}</h3>
                  <p className="text-sm text-gray-700">{statusDetails.description}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Invoice: {payload.invoice_number}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {renderOrderTimeline(statusDetails.step)}

            {/* Details */}
            <div className="mt-4 bg-white rounded-lg border p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Order Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Order Date</p>
                    <p className="text-sm text-gray-600">{formatDateTime(payload.order_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <FaMoneyBill className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Total Amount</p>
                    <p className="text-sm text-gray-600">TK {payload.total_amount}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Box className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Payment</p>
                    <p className="text-sm text-gray-600">
                      {payload.payment_type?.toUpperCase()} — {payload.payment_status}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Order ID</p>
                    <p className="text-sm text-gray-600">#{String(payload.order_id)}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" /> Items
                </h4>
                <div className="space-y-2.5">
                  {payload.product.map((item) => {
                    const productName = item.product?.name || "Product"
                    const thumbnail = item.variant?.image || item.product?.thumbnail || "/placeholder.svg"
                    const variantAttrs = item.variant?.attribute_values || {}
                    const variantDisplay =
                      Object.entries(variantAttrs)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ") || "Standard"

                    return (
                      <div key={item._id} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg">
                        <div className="relative h-12 w-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={thumbnail || "/placeholder.svg"}
                            alt={productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium truncate">{productName}</p>
                          <p className="text-[11px] text-gray-500 truncate">{variantDisplay}</p>
                          <p className="text-[11px] text-gray-500">Status: {item.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900 font-medium">TK {item.subtotal}</p>
                          <p className="text-[11px] text-gray-500">
                            Qty: {item.quantity} · Unit: TK {item.price}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary (minimal, since new API provides only total) */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">TK {payload.total_amount}</span>
                </div>
              </div>

              {/* Help */}
              <div className="mt-4 flex justify-center">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors">
                  <Info className="h-4 w-4" /> Need Help?
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )
    }

    return null
  }

  return (
    <Container className="w-full max-w-2xl min-h-[70vh] mb-16 flex flex-col justify-center px-4">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-2.5 bg-primary/10 rounded-full mb-3">
          <Truck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Track Your Order</h1>
        <p className="text-sm text-gray-600">Enter your invoice number to get updates</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="relative"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-28 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            placeholder="Enter your invoice number..."
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-colors flex items-center gap-2 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span>Track</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.form>

      {renderOrderStatus()}
    </Container>
  )
}

export default OrderTracker
