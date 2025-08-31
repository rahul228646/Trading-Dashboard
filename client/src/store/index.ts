import { configureStore } from "@reduxjs/toolkit";
import { tradingApi } from "./api";
import symbolsSlice from "./slices/symbolsSlice";
import tickerSlice from "./slices/tickerSlice";
import ordersSlice from "./slices/ordersSlice";
import uiSlice from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    symbols: symbolsSlice,
    ticker: tickerSlice,
    orders: ordersSlice,
    ui: uiSlice,
    [tradingApi.reducerPath]: tradingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore RTK Query actions
          "api/executeQuery/pending",
          "api/executeQuery/fulfilled",
          "api/executeQuery/rejected",
        ],
      },
    }).concat(tradingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
