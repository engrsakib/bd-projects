import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit"

export type AttributeSelection = Record<string, string>

export interface CartLine {
  id: string
  productId: string
  variantId: string
  attributes: AttributeSelection
  quantity: number
  priceSnapshot?: number
  addedAt: number
}

export interface CartState {
  items: CartLine[]
}
const initialState: CartState = { items: [] }

type AddPayload = Omit<CartLine, "id" | "addedAt"> & { productId: string; variantId: string }
type UpdateQtyPayload = { id: string; quantity: number }
type RemovePayload = { id: string }

const sameAttrs = (a: AttributeSelection, b: AttributeSelection) => JSON.stringify(a) === JSON.stringify(b)

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, { payload }: PayloadAction<AddPayload>) => {
      const existing = state.items.find(
        (i) =>
          i.productId === payload.productId &&
          i.variantId === payload.variantId &&
          sameAttrs(i.attributes, payload.attributes),
      )
      if (existing) {
        existing.quantity += payload.quantity
      } else {
        state.items.push({
          id: nanoid(),
          addedAt: Date.now(),
          ...payload,
        })
      }
    },
    updateQty: (state, { payload }: PayloadAction<UpdateQtyPayload>) => {
      const row = state.items.find((i) => i.id === payload.id)
      if (row) row.quantity = Math.max(1, payload.quantity)
    },
    removeItem: (state, { payload }: PayloadAction<RemovePayload>) => {
      state.items = state.items.filter((i) => i.id !== payload.id)
    },
    clearCart: (state) => {
      state.items = []
    },
  },
})

export const { addItem, updateQty, removeItem, clearCart } = cartSlice.actions

export const selectCartItems = (s: { cart: CartState }) => s.cart.items
export const selectCartCount = (s: { cart: CartState }) => s.cart.items.reduce((n, i) => n + i.quantity, 0)
export const selectCartSubtotal = (s: { cart: CartState }) =>
  s.cart.items.reduce((sum, i) => sum + (i.priceSnapshot ?? 0) * i.quantity, 0)

export default cartSlice.reducer
