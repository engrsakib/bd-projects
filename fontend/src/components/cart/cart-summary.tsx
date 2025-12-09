"use client"

import { ShoppingBag, CreditCard, Truck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface CartSummaryProps {
  itemCount: number
  totalPrice: number
  originalPrice?: number
  savings?: number
  savingsPercentage?: number
}

export function CartSummary({ itemCount, totalPrice, originalPrice, savings, savingsPercentage = 0 }: CartSummaryProps) {
  const shipping = 0
  const finalTotal = totalPrice + shipping

  return (
    <Card className="sticky shadow-none top-20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-medium text-cart-secondary">
          <ShoppingBag className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items ({itemCount})</span>
            <span>Tk {totalPrice.toFixed(2)}</span>
          </div>

          {savings && savings > 0 && (
            <div className="flex justify-between text-sm bg-green-50 -mx-2 px-2 py-2 rounded-md">
              <span className="text-green-700 font-medium">You saved</span>
              <span className="text-green-700 font-semibold">
                Tk {savings.toFixed(2)} ({savingsPercentage?.toFixed(0)}%)
              </span>
            </div>
          )}

          {/* <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                            FREE
                        </span>
                    </div> */}
        </div>

        <Separator />

        <div className="flex justify-between font-medium text-lg">
          <span>Total</span>
          <span className="text-cart-primary-dark">Tk {finalTotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">Secure Checkout & COD Available</span>
        </div>

        <div className="space-y-2">
          <Link href={"/checkout"}>
            <Button className="w-full bg-primary hover:bg-primary-mid text-white text-sm py-3" size="lg">
              <CreditCard className="h-4 w-4" />
              Proceed to Checkout
            </Button>
          </Link>

          <Link href={"/"}>
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-white bg-transparent shadow-none mt-3"
              size={"lg"}
            >
              <Truck className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* <div className="text-xs text-gray-500 text-center space-y-1">
                    <p>📦 Free returns within 30 days</p>
                </div> */}
      </CardContent>
    </Card>
  )
}
