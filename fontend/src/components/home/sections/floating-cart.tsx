"use client"
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
// import { openCart } from "@/redux/features/cart-slice"

const FloatingCart = () => {
    // const { totalItems } = useAppSelector((state) => state.cart)
     const dispatch = useAppDispatch()

    const totalItems = 0
    
    return (
        <div className="bottom-4 md:hidden fixed right-4 z-50">
            <Button
                onClick={() => {
                    // dispatch(openCart())
                }}
                variant="default"
                size="icon"
                className="relative cursor-pointer size-10 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90"
            >
                <ShoppingCart className="size-5 text-white" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {totalItems}
                    </span>
                )}
                <span className="sr-only">View cart</span>
            </Button>
        </div>
    )
}

export default FloatingCart
