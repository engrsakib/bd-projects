'use client'

import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'

const  PaymentSuccessPage =()=> {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        
        {/* Decorative top line */}
        <div className="mb-16 md:mb-24">
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary-mid rounded-full"></div>
        </div>

        {/* Main content section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center mb-20">
          
          {/* Left side - Icon and visual element */}
          <div className="flex flex-col items-start">
            <div className="mb-12">
              {/* Success circle badge */}
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-primary" >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-mid flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="space-y-6 w-full">
              <div className="h-2 bg-gray-100 rounded-full w-3/4"></div>
              <div className="h-2 bg-gray-100 rounded-full w-2/3"></div>
            </div>
          </div>

          {/* Right side - Text content */}
          <div className="flex flex-col justify-start">
            {/* Subtitle */}
            <p className="text-sm font-semibold text-primary-mid uppercase tracking-widest mb-4">Success</p>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl font-medium text-secondary mb-6 leading-tight">
              Payment
              <br />
              <span className="text-primary">
                Confirmed
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Your transaction has been completed successfully. A confirmation email with all details is on its way to your inbox.
            </p>

            {/* Secondary description */}
            <p className="text-sm text-gray-500 mb-10 leading-relaxed">
              Your order is being prepared and will be shipped soon. You can track your order status anytime from your account dashboard.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/"
                className="px-8 bg-primary py-4 rounded-xl font-semibold text-white text-center transition-all duration-300 hover:shadow-lg hover:scale-105"
                
              >
                Back to Home
              </Link>
              <Link 
                href="/orders"
                className="px-8 text-primary border-[2px] border-primary py-4 rounded-xl font-semibold text-center transition-all duration-300 hover:bg-gray-50 flex items-center justify-center gap-2"
                
              >
                View Orders <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer section */}
        <div className="border-t border-gray-200 pt-12 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Need assistance?</p>
              <p className="font-semibold text-secondary">We&apos;re here to help</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/support"
                className="inline-flex text-primary-mid items-center gap-2 font-semibold transition-all hover:gap-3"
              >
                Contact Support <ArrowRight size={18} />
              </Link>
              <Link 
                href="/faq"
                className="inline-flex items-center gap-2 font-semibold text-gray-600 transition-all hover:gap-3 hover:text-secondary"
              >
                View FAQ <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PaymentSuccessPage;