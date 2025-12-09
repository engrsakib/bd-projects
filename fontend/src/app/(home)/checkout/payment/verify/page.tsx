import PaymentVerify from '@/components/payment/verify';
import { API_BASE_URL } from '@/config';
import React, { Suspense } from 'react';

const page = async ({ searchParams }: { searchParams: Promise<{ order_id: string, paymentID: string, status: string, signature: string, apiVersion: string }> }) => {

    try {
        const { apiVersion, order_id, paymentID, signature, status } = await searchParams


        const url = `${API_BASE_URL}/transaction/callback?order_id=${order_id}&paymentID=${paymentID}&status=${status}&signature=${signature}&apiVersion=${apiVersion}`

        const response = await fetch(url);
        const data = await response.json();


        return (
            <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg  p-8 w-full max-w-md">
                        <div className="flex flex-col items-center justify-center">
                            <div className="loading-spinner mb-4"></div>
                            <h2 className="text-xl font-semibold text-secondary mb-2">Processing Payment</h2>
                            <p className="text-center text-gray-600 mb-4">Please wait while we verify your payment...</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full">
                                <p className="text-red-700 text-sm font-medium text-center">⚠️ Do not refresh this page</p>
                                <p className="text-red-600 text-xs text-center mt-1">Refreshing may cause payment failure</p>
                            </div>
                        </div>
                    </div>
                </div>
            }>
                <PaymentVerify data={data} />
            </Suspense>
        );
    } catch (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg  p-8 w-full max-w-md">
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Payment Error</h2>
                        <p className="text-center text-gray-600">{(error as any).message || 'Something went wrong. Please try again.'}</p>
                    </div>
                </div>
            </div>
      )
    }
};

export default page;
export const dynamic = 'force-dynamic'