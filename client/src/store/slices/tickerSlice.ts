import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Tick } from "../../types/trading";

interface TickerState {
  ticks: Record<string, Tick[]>; // symbol -> tick history
  latestTicks: Record<string, Tick>; // symbol -> latest tick
  loading: Record<string, boolean>; // symbol -> loading state
  connected: boolean;
  lastUpdate: number | null;
}

const initialState: TickerState = {
  ticks: {},
  latestTicks: {},
  loading: {},
  connected: false,
  lastUpdate: null,
};

const tickerSlice = createSlice({
  name: "ticker",
  initialState,
  reducers: {
    addTick: (state, action: PayloadAction<Tick>) => {
      const { symbol } = action.payload;

      // Update latest tick
      state.latestTicks[symbol] = action.payload;

      // Add to history (keep last 100 ticks)
      if (!state.ticks[symbol]) {
        state.ticks[symbol] = [];
      }
      state.ticks[symbol].push(action.payload);
      if (state.ticks[symbol].length > 100) {
        state.ticks[symbol] = state.ticks[symbol].slice(-100);
      }

      state.lastUpdate = Date.now();
    },

    setTickHistory: (
      state,
      action: PayloadAction<{ symbol: string; ticks: Tick[] }>
    ) => {
      const { symbol, ticks } = action.payload;
      state.ticks[symbol] = ticks;
      if (ticks.length > 0) {
        state.latestTicks[symbol] = ticks[ticks.length - 1];
      }
    },

    setLoading: (
      state,
      action: PayloadAction<{ symbol: string; loading: boolean }>
    ) => {
      const { symbol, loading } = action.payload;
      state.loading[symbol] = loading;
    },

    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },

    clearTicksForSymbol: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      delete state.ticks[symbol];
      delete state.latestTicks[symbol];
      delete state.loading[symbol];
    },
  },
});

export const {
  addTick,
  setTickHistory,
  setLoading,
  setConnected,
  clearTicksForSymbol,
} = tickerSlice.actions;

export default tickerSlice.reducer;
