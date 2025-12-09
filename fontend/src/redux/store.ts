import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import baseSlice from "./features/baseSlice";
import cartReducer from "./features/cart-slice";
import wishlistReducer from "./features/wishlist-slice";
import preOrderReducer from "./features/preorder-slice"; 

import api from "./api/api-query";

const rootReducer = combineReducers({
  utils: baseSlice,
  [api.reducerPath]: api.reducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  preOrder: preOrderReducer, 
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cart", "wishlist", "preOrder"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
