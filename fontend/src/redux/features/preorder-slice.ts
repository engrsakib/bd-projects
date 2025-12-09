import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export type AttributeSelection = Record<string, string>;

export interface PreOrderLine {
    id: string;
    productId: string;
    variantId: string;
    attributes: AttributeSelection;
    quantity: number; 
    priceSnapshot?: number;
    advancePaymentPercentage?: number; 
    expectedDeliveryDays?: number; 
    addedAt: number;
    name?: string;
    image?: string;
    sku?: string;
}

export interface SavedForLaterItem {
    id: string;
    productId: string;
    variantId?: string;
    attributes?: AttributeSelection;
    name?: string;
    image?: string;
    priceSnapshot?: number;
    addedAt: number;
}

export interface PreOrderState {
    current: PreOrderLine | null;
    savedForLater: SavedForLaterItem[];
}

const initialState: PreOrderState = {
    current: null,
    savedForLater: [],
};

type SetPreOrderPayload = Omit<
    PreOrderLine,
    "id" | "addedAt" | "quantity"
> & {
    quantity?: number; // will be clamped to 1 anyway
};

type SaveForLaterAddPayload = Omit<SavedForLaterItem, "id" | "addedAt">;

const sameAttrs = (a?: AttributeSelection, b?: AttributeSelection) =>
    JSON.stringify(a || {}) === JSON.stringify(b || {});

const preorderSlice = createSlice({
    name: "preOrder",
    initialState,
    reducers: {
        setPreOrder: (state, { payload }: PayloadAction<SetPreOrderPayload>) => {
            // enforce only ONE pre-order and quantity = 1
            state.current = {
                id: nanoid(),
                addedAt: Date.now(),
                ...payload,
                quantity: 1,
            };
        },
        clearPreOrder: (state) => {
            state.current = null;
        },
        saveForLaterAdd: (state, { payload }: PayloadAction<SaveForLaterAddPayload>) => {
            const exists = state.savedForLater.find(
                (i) =>
                    i.productId === payload.productId &&
                    i.variantId === payload.variantId &&
                    sameAttrs(i.attributes, payload.attributes)
            );
            if (!exists) {
                state.savedForLater.unshift({
                    id: nanoid(),
                    addedAt: Date.now(),
                    ...payload,
                });
            }
        },
        saveForLaterRemove: (state, { payload }: PayloadAction<{ id: string }>) => {
            state.savedForLater = state.savedForLater.filter((i) => i.id !== payload.id);
        },
        moveSavedToPreOrder: (state, { payload }: PayloadAction<{ id: string }>) => {
            const found = state.savedForLater.find((i) => i.id === payload.id);
            if (found) {
                state.current = {
                    id: nanoid(),
                    addedAt: Date.now(),
                    productId: found.productId,
                    variantId: found.variantId || "",
                    attributes: found.attributes || {},
                    quantity: 1,
                    priceSnapshot: found.priceSnapshot,
                    name: found.name,
                    image: found.image,
                };
                state.savedForLater = state.savedForLater.filter((i) => i.id !== payload.id);
            }
        },
        clearSavedForLater: (state) => {
            state.savedForLater = [];
        },
    },
});

export const {
    setPreOrder,
    clearPreOrder,
    saveForLaterAdd,
    saveForLaterRemove,
    moveSavedToPreOrder,
    clearSavedForLater,
} = preorderSlice.actions;

export const selectPreOrderCurrent = (s: { preOrder: PreOrderState }) => s.preOrder.current;
export const selectSavedForLater = (s: { preOrder: PreOrderState }) => s.preOrder.savedForLater;
export const selectSavedForLaterCount = (s: { preOrder: PreOrderState }) => s.preOrder.savedForLater.length;

export default preorderSlice.reducer;
