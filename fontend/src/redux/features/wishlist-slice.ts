import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit"

export interface WishlistLine {
  id: string
  productId: string
  variantId?: string
  addedAt: number
}

export interface WishlistState {
  items: WishlistLine[]
}

const initialState: WishlistState = { items: [] }

type AddPayload = { productId: string; variantId?: string }
type RemoveByIdPayload = { id: string }
type RemoveByKeyPayload = { productId: string; variantId?: string }

const sameKey = (a: WishlistLine, b: AddPayload) =>
  a.productId === b.productId && (a.variantId ?? "") === (b.variantId ?? "")

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addItem: (state, { payload }: PayloadAction<AddPayload>) => {
      const exists = state.items.find((i) => sameKey(i, payload))
      if (!exists) {
        state.items.push({
          id: nanoid(),
          productId: payload.productId,
          variantId: payload.variantId,
          addedAt: Date.now(),
        })
      }
    },
    removeItem: (state, { payload }: PayloadAction<RemoveByIdPayload>) => {
      state.items = state.items.filter((i) => i.id !== payload.id)
    },
    removeByKey: (state, { payload }: PayloadAction<RemoveByKeyPayload>) => {
      state.items = state.items.filter((i) => !sameKey(i, payload))
    },
    toggleItem: (state, { payload }: PayloadAction<AddPayload>) => {
      const idx = state.items.findIndex((i) => sameKey(i, payload))
      if (idx >= 0) {
        state.items.splice(idx, 1)
      } else {
        state.items.push({
          id: nanoid(),
          productId: payload.productId,
          variantId: payload.variantId,
          addedAt: Date.now(),
        })
      }
    },
    clearWishlist: (state) => {
      state.items = []
    },
  },
})

export const { addItem, removeItem, removeByKey, toggleItem, clearWishlist } = wishlistSlice.actions

export const selectWishlistItems = (s: { wishlist: WishlistState }) => s.wishlist.items
export const selectIsWishedByProductId =
  (productId: string, variantId?: string) =>
    (s: { wishlist: WishlistState }) =>
      s.wishlist.items.some((i) => i.productId === productId && (variantId ? i.variantId === variantId : true))

export default wishlistSlice.reducer
