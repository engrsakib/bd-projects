'use client'

import Link from 'next/link'
import { AlertCircle, ArrowRight, RotateCcw, Home } from 'lucide-react'

const PaymentFailedPage =()=> {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Error Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="mb-2">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto  "
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={40} className="text-red-600" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-4xl text-red-600 font-medium mb-3" >
            Payment Failed
          </h1>
          <p className="text-sm text-gray-600 max-w-md">
            Unfortunately, your payment could not be processed. Please try again or use a different payment method.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="px-4 py-2 rounded-full text-sm font-semibold text-red-600 bg-red-50 border border-red-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              Failed
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="bg-primary/10 border border-primary-mid/40 rounded-lg p-6 mb-8">
            <p className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <span className="w-5 h-5 flex items-center justify-center rounded bg-blue-500 text-white text-xs font-bold">💡</span>
              Troubleshooting Tips
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <div 
                  className="w-5 bg-primary h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Verify your card details are correct</span>
              </li>
              <li className="flex gap-3 items-start">
                <div 
                  className="w-5 bg-primary h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Check if your card has sufficient funds</span>
              </li>
              <li className="flex gap-3 items-start">
                <div 
                  className="w-5 h-5 bg-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Contact your bank to enable online transactions</span>
              </li>
              <li className="flex gap-3 items-start">
                <div 
                  className="w-5 h-5 bg-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Try using a different payment method</span>
              </li>
            </ul>
          </div>

          {/* <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600 font-medium mb-1">Reason:</p>
            <p className="text-gray-800 font-semibold">Your card was declined by your bank. Please contact your bank for more information.</p>
          </div> */}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => window.history.back()}
            className="flex-1 bg-primary py-3 px-6 rounded-lg font-semibold text-white text-center transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Try Again
          </button>
          <Link 
            href="/"
            className="flex-1 text-primary border-primary py-3 px-6 rounded-lg font-semibold border-2 text-center transition-all duration-300 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-4">Need additional help?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/support"
              className="inline-flex items-center gap-2 font-semibold transition-all hover:gap-3"
              style={{ color: 'var(--primary-mid)' }}
            >
              Contact Support <ArrowRight size={16} />
            </Link>
            <span className="text-gray-400 hidden sm:block">•</span>
            <Link 
              href="/faq"
              className="inline-flex items-center gap-2 font-semibold transition-all hover:gap-3"
              style={{ color: 'var(--primary-mid)' }}
            >
              View FAQ <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PaymentFailedPage;