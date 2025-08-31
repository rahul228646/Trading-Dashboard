import React from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import { TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";
import { useAppSelector } from "../store/hooks";
import { useGetLatestTickQuery, useGetSymbolsQuery } from "../store/api";

const LiveTicker: React.FC = () => {
  const selectedSymbol = useAppSelector(
    (state) => (state as any).symbols?.selectedSymbol
  );
  const connectionStatus = useAppSelector(
    (state) => (state as any).ui?.connectionStatus || "disconnected"
  );

  // Fetch symbols data to get close prices
  const { data: symbolsData } = useGetSymbolsQuery();

  const {
    data: latestTick,
    isLoading,
    error,
  } = useGetLatestTickQuery(selectedSymbol || "", { skip: !selectedSymbol });

  // Get the selected symbol's close price from the fetched symbols data
  const selectedSymbolData = symbolsData?.find(
    (s: any) => s.symbol === selectedSymbol
  );
  const closePrice = selectedSymbolData?.closePrice || 0;

  // Debug logging
  React.useEffect(() => {
    if (selectedSymbol) {
      console.log("Selected Symbol:", selectedSymbol);
      console.log("Symbols Data:", symbolsData);
      console.log("Selected Symbol Data:", selectedSymbolData);
      console.log("Close Price:", closePrice);
    }
  }, [selectedSymbol, symbolsData, selectedSymbolData, closePrice]);

  // Calculate price change if we have both current and close prices
  const currentPrice = latestTick?.price || 0;
  const priceChange = closePrice > 0 ? currentPrice - closePrice : 0;
  const priceChangePercent =
    closePrice > 0 ? (priceChange / closePrice) * 100 : 0;

  // Determine trend direction
  const getTrendIcon = () => {
    if (priceChange > 0) return <TrendingUp color="success" />;
    if (priceChange < 0) return <TrendingDown color="error" />;
    return <TrendingFlat color="action" />;
  };

  const getTrendColor = () => {
    if (priceChange > 0) return "success.main";
    if (priceChange < 0) return "error.main";
    return "text.secondary";
  };

  if (!selectedSymbol) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Live Ticker
        </Typography>
        <Typography color="text.secondary">
          Please select a symbol to view live price data
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Live Ticker - {selectedSymbol}
        </Typography>
        <Typography color="error">
          Failed to load ticker data. Server may be offline.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h6">Live Ticker - {selectedSymbol}</Typography>
        <Chip
          label={connectionStatus.toUpperCase()}
          color={connectionStatus === "connected" ? "success" : "warning"}
          size="small"
        />
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading ticker data...</Typography>
      ) : latestTick ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Current Price
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: getTrendColor() }}
            >
              ${currentPrice.toFixed(2)}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Close Price
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {closePrice > 0 ? `$${closePrice.toFixed(2)}` : "Loading..."}
            </Typography>
            {closePrice === 0 && (
              <Typography variant="caption" color="text.secondary">
                Symbol data loading
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Change
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {closePrice > 0 ? (
                getTrendIcon()
              ) : (
                <TrendingFlat color="action" />
              )}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: closePrice > 0 ? getTrendColor() : "text.secondary",
                    fontWeight: "bold",
                  }}
                >
                  {closePrice > 0
                    ? `$${Math.abs(priceChange).toFixed(2)}`
                    : "N/A"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: closePrice > 0 ? getTrendColor() : "text.secondary",
                  }}
                >
                  {closePrice > 0
                    ? `(${
                        priceChangePercent >= 0 ? "+" : ""
                      }${priceChangePercent.toFixed(2)}%)`
                    : "Waiting for data"}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Volume
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {latestTick.volume.toLocaleString()}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Last Update
            </Typography>
            <Typography variant="body1">
              {new Date(latestTick.timestamp * 1000).toLocaleTimeString()}
            </Typography>
          </Paper>
        </Box>
      ) : (
        <Typography color="text.secondary">
          No ticker data available for {selectedSymbol}
        </Typography>
      )}
    </Box>
  );
};

export default LiveTicker;
