import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Symbol,
  Tick,
  Order,
  CreateOrderRequest,
  OrderValidationResponse,
} from "../types/trading";

const baseUrl = "http://localhost:3001/api";

export const tradingApi = createApi({
  reducerPath: "tradingApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Symbol", "Tick", "Order"],
  endpoints: (builder) => ({
    // Symbols endpoints
    getSymbols: builder.query<Symbol[], void>({
      query: () => "/symbols",
      providesTags: ["Symbol"],
    }),

    // Ticks endpoints
    getLatestTick: builder.query<Tick | null, string>({
      query: (symbol) => `/ticks/${symbol}/latest`,
      providesTags: (_, __, symbol) => [{ type: "Tick", id: symbol }],
    }),

    getTickHistory: builder.query<Tick[], { symbol: string; limit?: number }>({
      query: ({ symbol, limit = 100 }) =>
        `/ticks/${symbol}/history?limit=${limit}`,
      providesTags: (_, __, { symbol }) => [
        { type: "Tick", id: `${symbol}-history` },
      ],
    }),

    // Orders endpoints
    getOrders: builder.query<Order[], string>({
      query: (symbol) => `/orders/${symbol}`,
      providesTags: (result, __, symbol) => [
        { type: "Order", id: symbol },
        ...(result?.map((order) => ({
          type: "Order" as const,
          id: order.id,
        })) || []),
      ],
    }),

    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (order) => ({
        url: "/orders",
        method: "POST",
        body: order,
      }),
      invalidatesTags: (_, __, order) => [{ type: "Order", id: order.symbol }],
    }),

    validateOrder: builder.mutation<
      OrderValidationResponse,
      CreateOrderRequest
    >({
      query: (order) => ({
        url: "/orders/validate",
        method: "POST",
        body: order,
      }),
    }),

    deleteOrder: builder.mutation<void, { symbol: string; orderId: number }>({
      query: ({ symbol, orderId }) => ({
        url: `/orders/${symbol}/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, { symbol }) => [{ type: "Order", id: symbol }],
    }),
  }),
});

export const {
  useGetSymbolsQuery,
  useGetLatestTickQuery,
  useGetTickHistoryQuery,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useValidateOrderMutation,
  useDeleteOrderMutation,
} = tradingApi;
