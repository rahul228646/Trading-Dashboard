import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { useAppSelector } from "../store/hooks";
import { useCreateOrderMutation, useGetLatestTickQuery } from "../store/api";

const OrderForm: React.FC = () => {
  const selectedSymbol = useAppSelector(
    (state) => state.symbols.selectedSymbol
  );
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const { data: latestTick } = useGetLatestTickQuery(selectedSymbol || "", {
    skip: !selectedSymbol,
    pollingInterval: 1000,
  });

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSymbol || !quantity || !price) {
      return;
    }

    // Client-side validation
    const qtyNum = parseInt(quantity);
    const priceNum = parseFloat(price);

    if (qtyNum <= 0) {
      console.error("Quantity must be positive");
      return;
    }

    if (priceNum <= 0) {
      console.error("Price must be positive");
      return;
    }

    try {
      await createOrder({
        symbol: selectedSymbol,
        side: orderType,
        qty: qtyNum,
        price: priceNum,
      }).unwrap();

      // Reset form
      setQuantity("");
      setPrice("");
    } catch (err) {
      console.error("Failed to create order:", err);
    }
  };

  const currentPrice = latestTick?.price || 0;
  const suggestedPrice = currentPrice.toFixed(2);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Place Order
      </Typography>

      {!selectedSymbol ? (
        <Alert severity="warning">Please select a symbol first</Alert>
      ) : (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <FormControl fullWidth>
            <InputLabel>Order Type</InputLabel>
            <Select
              value={orderType}
              label="Order Type"
              onChange={(e) => setOrderType(e.target.value as "BUY" | "SELL")}
            >
              <MenuItem value="BUY">Buy</MenuItem>
              <MenuItem value="SELL">Sell</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 1 }}
          />

          <TextField
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            fullWidth
            required
            helperText={currentPrice ? `Current: $${suggestedPrice}` : ""}
            inputProps={{ step: 0.01, min: 0.01 }}
          />

          {currentPrice > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPrice(suggestedPrice)}
            >
              Use Current Price
            </Button>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !selectedSymbol || !quantity || !price}
            color={orderType === "BUY" ? "primary" : "secondary"}
          >
            {isLoading ? "Placing..." : `${orderType} ${selectedSymbol}`}
          </Button>

          {error && (
            <Alert severity="error">
              {(() => {
                // Handle RTK Query error structure
                if ("status" in error) {
                  // FetchBaseQueryError
                  if (error.data && typeof error.data === "object") {
                    const errorData = error.data as any;
                    const errorMsg = errorData.error || errorData.message;

                    // Categorize common errors for better UX
                    if (errorMsg?.includes("Price must be within")) {
                      return `❌ ${errorMsg}`;
                    } else if (
                      errorMsg?.includes("side: Required") ||
                      errorMsg?.includes("qty: Required")
                    ) {
                      return "❌ Please fill in all required fields";
                    } else if (
                      errorMsg?.includes("Symbol") &&
                      errorMsg?.includes("not found")
                    ) {
                      return "❌ Invalid symbol selected";
                    } else if (
                      errorMsg?.includes("Price must be greater than 0")
                    ) {
                      return "❌ Price must be greater than $0.00";
                    } else if (
                      errorMsg?.includes("Quantity must be a positive integer")
                    ) {
                      return "❌ Quantity must be a positive whole number";
                    } else if (error.status === 429) {
                      return "❌ Too many requests. Please wait a moment and try again.";
                    } else if (
                      typeof error.status === "number" &&
                      error.status >= 500
                    ) {
                      return "❌ Server error. Please try again later.";
                    } else {
                      return `❌ ${
                        errorMsg ||
                        `Error ${error.status}: Failed to place order`
                      }`;
                    }
                  }
                  return `❌ Error ${error.status}: Failed to place order`;
                } else if ("message" in error) {
                  // SerializedError
                  return `❌ ${error.message || "Failed to place order"}`;
                } else {
                  return "❌ Failed to place order";
                }
              })()}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OrderForm;
