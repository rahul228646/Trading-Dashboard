import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Order } from "../../types/trading";
import type { OrderFilter, TableSort } from "../../types/ui";

interface OrdersState {
  orders: Record<string, Order[]>; // symbol -> orders
  loading: Record<string, boolean>; // symbol -> loading state
  filter: OrderFilter;
  sort: TableSort;
  selectedOrderId: string | null;
}

const initialState: OrdersState = {
  orders: {},
  loading: {},
  filter: "ALL",
  sort: { field: "timestamp", direction: "desc" },
  selectedOrderId: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (
      state,
      action: PayloadAction<{ symbol: string; orders: Order[] }>
    ) => {
      const { symbol, orders } = action.payload;
      state.orders[symbol] = orders;
    },

    addOrder: (state, action: PayloadAction<Order>) => {
      const { symbol } = action.payload;
      if (!state.orders[symbol]) {
        state.orders[symbol] = [];
      }
      state.orders[symbol].push(action.payload);
    },

    updateOrder: (state, action: PayloadAction<Order>) => {
      const { symbol, id } = action.payload;
      if (state.orders[symbol]) {
        const index = state.orders[symbol].findIndex(
          (order) => order.id === id
        );
        if (index !== -1) {
          state.orders[symbol][index] = action.payload;
        }
      }
    },

    removeOrder: (
      state,
      action: PayloadAction<{ symbol: string; orderId: number }>
    ) => {
      const { symbol, orderId } = action.payload;
      if (state.orders[symbol]) {
        state.orders[symbol] = state.orders[symbol].filter(
          (order) => order.id !== orderId
        );
      }
      if (state.selectedOrderId === orderId.toString()) {
        state.selectedOrderId = null;
      }
    },

    setLoading: (
      state,
      action: PayloadAction<{ symbol: string; loading: boolean }>
    ) => {
      const { symbol, loading } = action.payload;
      state.loading[symbol] = loading;
    },

    setFilter: (state, action: PayloadAction<OrderFilter>) => {
      state.filter = action.payload;
    },

    setSort: (state, action: PayloadAction<TableSort>) => {
      state.sort = action.payload;
    },

    setSelectedOrderId: (state, action: PayloadAction<string | null>) => {
      state.selectedOrderId = action.payload;
    },

    clearOrdersForSymbol: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      delete state.orders[symbol];
      delete state.loading[symbol];
    },
  },
});

export const {
  setOrders,
  addOrder,
  updateOrder,
  removeOrder,
  setLoading,
  setFilter,
  setSort,
  setSelectedOrderId,
  clearOrdersForSymbol,
} = ordersSlice.actions;

export default ordersSlice.reducer;
