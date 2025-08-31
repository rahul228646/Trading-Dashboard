import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Symbol } from "../../types/trading";

interface SymbolsState {
  symbols: Symbol[];
  selectedSymbol: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SymbolsState = {
  symbols: [],
  selectedSymbol: null,
  loading: false,
  error: null,
};

const symbolsSlice = createSlice({
  name: "symbols",
  initialState,
  reducers: {
    setSelectedSymbol: (state, action: PayloadAction<string | null>) => {
      state.selectedSymbol = action.payload;
    },
    setSymbols: (state, action: PayloadAction<Symbol[]>) => {
      state.symbols = action.payload;
      // Auto-select first symbol if none selected
      if (!state.selectedSymbol && action.payload.length > 0) {
        state.selectedSymbol = action.payload[0].symbol;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSelectedSymbol, setSymbols, setLoading, setError } =
  symbolsSlice.actions;
export default symbolsSlice.reducer;
