"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { XCircle, RefreshCw, ArrowLeft, Phone, Mail, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

export default function OrderFailedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(15)


  const handleRetry = () => {
    router.push("/checkout")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div
      className="min-h-screen pb-10 bg-gray-50 flex items-center justify-center p-4"
      
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              lang="bn"
        className="max-w-xl w-full bg-white rounded-2xl  p-8 text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-12 h-12 text-red-500" />
        </motion.div>

        {/* Error Message */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-2xl font-bold text-secondary mb-2">অর্ডার ব্যর্থ হয়েছে!</h1>
          <h2 className="text-xl font-semibold text-red-600 mb-4">Order Failed!</h2>
          <p className="text-gray-600 mb-6">দুঃখিত, আপনার অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
        </motion.div>

        {/* Error Details */}
        <div className="md:grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-700">Possible Reasons:</span>
              </div>
              <ul className="text-sm text-red-600 text-left space-y-1">
                <li>• Payment processing failed</li>
                <li>• Network connection issue</li>
                <li>• Server temporarily unavailable</li>
                <li>• Invalid payment information</li>
              </ul>
            </motion.div>
    
            {/* Retry Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <h3 className="font-semibold text-blue-700 mb-2">What to do next:</h3>
              <ul className="text-sm text-blue-600 text-left space-y-1">
                <li>• Check your internet connection</li>
                <li>• Verify your payment details</li>
                <li>• Try again in a few minutes</li>
                <li>• Contact support if problem persists</li>
              </ul>
            </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <button
            onClick={handleRetry}
            className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className="w-full border border-secondary text-secondary py-3 rounded-lg font-medium hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
