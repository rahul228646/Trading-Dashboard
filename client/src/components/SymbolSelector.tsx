import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useGetSymbolsQuery } from "../store/api";
import { setSelectedSymbol } from "../store/slices/symbolsSlice";

const SymbolSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedSymbol = useAppSelector(
    (state) => (state as any).symbols?.selectedSymbol
  );

  const { data: symbols = [], isLoading, error } = useGetSymbolsQuery();

  const handleSymbolChange = (symbol: string) => {
    dispatch(setSelectedSymbol(symbol));
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Symbol Selector
        </Typography>
        <Typography color="error">
          Failed to load symbols. Please check if the server is running.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Symbol Selector
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Select Symbol</InputLabel>
        <Select
          value={selectedSymbol || ""}
          label="Select Symbol"
          onChange={(e) => handleSymbolChange(e.target.value)}
          disabled={isLoading}
        >
          {isLoading ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading symbols...
            </MenuItem>
          ) : (
            symbols.map((symbol) => (
              <MenuItem key={symbol.symbol} value={symbol.symbol}>
                {symbol.symbol} - {symbol.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SymbolSelector;
