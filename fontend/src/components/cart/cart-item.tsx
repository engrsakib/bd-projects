"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

import { useAppDispatch } from "@/redux/store" // or "@/redux/hooks" if you keep hooks there
import { removeItem, updateQty } from "@/redux/features/cart-slice"
type CartItemView = {
    _id: string
    product: {
        _id: string
        name: string
        sku?: string
        thumbnail?: string | null
    }
    variant: string // variantId
    attributes: Record<string, string>
    quantity: number
    price: number // unit price to show
}
interface CartItemProps {
    item: CartItemView
}

 const CartItemComponent = ({ item }: CartItemProps) => {
    const dispatch = useAppDispatch()

    const [quantity, setQuantity] = useState(item.quantity)
    const [draftQty, setDraftQty] = useState(String(item.quantity))

    // keep local input in sync if Redux changes outside
    useEffect(() => {
        setQuantity(item.quantity)
        setDraftQty(String(item.quantity))
    }, [item.quantity])

    const priceEach = item.price
    const subtotal = useMemo(() => priceEach * quantity, [priceEach, quantity])

    const commitQuantity = (newQuantity: number) => {
        const q = Number.isNaN(newQuantity) ? 1 : Math.max(1, newQuantity)
        if (q === quantity) {
            setDraftQty(String(quantity))
            return
        }
        dispatch(updateQty({ id: item._id, quantity: q }))
        setQuantity(q)
        setDraftQty(String(q))
        toast.success("Item quantity has been updated.")
    }

    const increment = () => commitQuantity(quantity + 1)
    const decrement = () => commitQuantity(quantity - 1)

    const handleRemove = () => {
        dispatch(removeItem({ id: item._id }))
        toast.success("Item removed from cart.")
    }

    const onInputChange = (value: string) => {
        // allow only digits
        setDraftQty(value.replace(/\D+/g, ""))
    }

    const onInputBlur = () => {
        const parsed = parseInt(draftQty || "1", 10)
        commitQuantity(parsed)
    }

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur()
    }
    

    return (
        <Card className="group relative rounded-xl border border-border bg-background transition-shadow shadow-none">
            <CardContent className="px-4 py-0">
                <div className="grid grid-cols-[88px_1fr_auto] sm:grid-cols-[104px_1fr_auto] items-start gap-4 ">
                    <div className="relative aspect-square w-[88px] sm:w-[104px] overflow-hidden rounded-xl bg-muted">
                        <Image
                            src={item.product.thumbnail || "/placeholder.svg?height=208&width=208&query=product"}
                            alt={item.product.name}
                            width={208}
                            height={208}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>

                    <div className="min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="line-clamp-2 text-sm sm:text-base font-medium text-foreground">
                                    {item.product.name}
                                </h3>
                                {item.product.sku && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemove}
                                aria-label="Remove item"
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {!!item.attributes && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {Object.entries(item.attributes).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="rounded-md text-[10px] font-medium ">
                                        <span className="mr-1 uppercase text-muted-foreground">{key}:</span>
                                        {String(value)}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Price & Quantity */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-medium text-primary sm:text-xl">Tk {priceEach.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground sm:text-sm">each</span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={decrement}
                                    disabled={quantity <= 1}
                                    className="size-7 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                    aria-label="Decrease quantity"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>

                                <Input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={draftQty}
                                    onChange={(e) => onInputChange(e.target.value)}
                                    onBlur={onInputBlur}
                                    onKeyDown={onInputKeyDown}
                                    className="h-7 w-12 rounded-lg border-primary text-center focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    aria-label="Quantity"
                                />

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={increment}
                                    className="size-7 rounded-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                    aria-label="Increase quantity"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Subtotal */}
                        <div className="mt-2 flex items-center justify-between border-t pt-3">
                            <span className="text-sm text-muted-foreground">Subtotal</span>
                            <span className="text-lg font-medium text-primary sm:text-xl">Tk {subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default CartItemComponent
