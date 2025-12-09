"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { decryptPhone } from "@/lib/crypto"
import Link from "next/link"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { API_BASE_URL } from "@/config"
import { setCookie } from "@/auth/cookies"
import { toast } from "sonner"
import axios from "axios"
import { useGetUserInfoQuery } from "@/redux/api/api-query"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams();
  const { refetch } = useGetUserInfoQuery({});

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      try {
        const decryptedPhone = decryptPhone(token)
        setPhoneNumber(decryptedPhone)
      } catch (error) {
        console.error("Failed to decrypt phone number:", error)
        router.push("/register")
      }
    } else {
      router.push("/register")
    }
  }, [searchParams, router])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(API_BASE_URL + "/user/verify", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp: Number.parseInt(otp),
        }),
      })

      const data = await response.json()

      console.log(data, 'OTP data')

      if (response.ok && data.success) {

        toast.success(data?.message || "OTP verified successfully")
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }

      } else {
        setError(data.message || "Invalid OTP. Please try again.")
      }
    } catch (error: any) {
      console.error("OTP verification error:", error)
      toast.error(error.response.data?.message || "Network error. Please try again.")
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    try {

      const res = await axios.post(API_BASE_URL + '/user/resend-otp', {
        phone_number: phoneNumber,
      });
      console.log('OTP RESEND RESPONSE : ', res);
      if (res.status === 200) {
        toast.success(res.data?.message || 'OTP sent successfully');
      }


    } catch (error: any) {
      console.log('OTP resend error:', error);
      toast.error(error.response.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false)
    }
  }

  if (!phoneNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-none p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium text-gray-900">Verify Your Phone</h2>
            <p className="text-gray-600 mt-2">We&apos;ve sent a 5-digit code to</p>
            <p className="text-gray-900 font-medium">
              {phoneNumber.substring(0, 3)}
              {"****"}
              {phoneNumber.substring(phoneNumber.length - 2)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-500 mb-2">
                Enter OTP Code
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value)
                    setError("")
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="mt-1 text-sm text-red-600 text-center">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-11 text-sm bg-primary hover:bg-secondary text-white px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-gray-600">{"Didn't receive the code?"}</p>
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-primary hover:text-secondary font-medium transition-colors disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>

            <div className="pt-4 border-t border-gray-200">
              <Link href="/register" className="text-gray-600 hover:text-gray-500 text-sm transition-colors">
                ← Back to Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
