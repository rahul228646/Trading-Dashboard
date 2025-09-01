import React from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppSelector } from "../store/hooks";
import { useGetTickHistoryQuery } from "../store/api";

interface OHLCData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

interface OHLCChartProps {
  height?: number;
  candleInterval?: number;
}

const OHLCChart: React.FC<OHLCChartProps> = ({
  height = 400,
  candleInterval = 10,
}) => {
  const selectedSymbol = useAppSelector(
    (state) => (state as any).symbols?.selectedSymbol
  );
  const connectionStatus = useAppSelector(
    (state) => (state as any).ui?.connectionStatus || "disconnected"
  );

  const [timeRange, setTimeRange] = React.useState(100);
  const [interval, setInterval] = React.useState(candleInterval);

  const {
    data: tickHistory,
    isLoading,
    error,
  } = useGetTickHistoryQuery(
    { symbol: selectedSymbol || "", limit: timeRange },
    { skip: !selectedSymbol, refetchOnMountOrArgChange: true }
  );

  // Convert tick data to OHLC data by grouping ticks into intervals
  const ohlcData = React.useMemo((): OHLCData[] => {
    if (!tickHistory || tickHistory.length === 0) return [];

    const groups: OHLCData[] = [];

    for (let i = 0; i < tickHistory.length; i += interval) {
      const chunk = tickHistory.slice(i, i + interval);
      if (chunk.length === 0) continue;

      const prices = chunk.map((tick) => tick.price);
      const volumes = chunk.map((tick) => tick.volume);

      const open = chunk[0].price;
      const close = chunk[chunk.length - 1].price;
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
      const change = close - open;
      const changePercent = open !== 0 ? (change / open) * 100 : 0;

      groups.push({
        time: new Date(chunk[0].timestamp * 1000).toLocaleTimeString(),
        timestamp: chunk[0].timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(totalVolume / chunk.length), // Average volume
        change,
        changePercent,
      });
    }

    return groups;
  }, [tickHistory, interval]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].payload) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Typography variant="body2">Open:</Typography>
            <Typography variant="body2">${data.open.toFixed(2)}</Typography>

            <Typography variant="body2">High:</Typography>
            <Typography variant="body2" color="success.main">
              ${data.high.toFixed(2)}
            </Typography>

            <Typography variant="body2">Low:</Typography>
            <Typography variant="body2" color="error.main">
              ${data.low.toFixed(2)}
            </Typography>

            <Typography variant="body2">Close:</Typography>
            <Typography variant="body2">${data.close.toFixed(2)}</Typography>

            <Typography variant="body2">Volume:</Typography>
            <Typography variant="body2">
              {data.volume.toLocaleString()}
            </Typography>

            <Typography variant="body2">Change:</Typography>
            <Typography
              variant="body2"
              color={data.change >= 0 ? "success.main" : "error.main"}
            >
              {data.change >= 0 ? "+" : ""}${data.change.toFixed(2)}(
              {data.changePercent.toFixed(2)}%)
            </Typography>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  if (!selectedSymbol) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h6" gutterBottom>
          OHLC Chart
        </Typography>
        <Typography color="text.secondary">
          Please select a symbol to view OHLC chart
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h6" gutterBottom>
          OHLC Chart - {selectedSymbol}
        </Typography>
        <Typography color="error">
          Failed to load chart data. Server may be offline.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6">{selectedSymbol} OHLC Chart</Typography>
          <Chip
            label={connectionStatus.toUpperCase()}
            color={connectionStatus === "connected" ? "success" : "warning"}
            size="small"
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Data Points</InputLabel>
            <Select
              value={timeRange}
              label="Data Points"
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <MenuItem value={50}>50 Ticks</MenuItem>
              <MenuItem value={100}>100 Ticks</MenuItem>
              <MenuItem value={200}>200 Ticks</MenuItem>
              <MenuItem value={500}>500 Ticks</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Interval</InputLabel>
            <Select
              value={interval}
              label="Interval"
              onChange={(e) => setInterval(Number(e.target.value))}
            >
              <MenuItem value={5}>5 Ticks</MenuItem>
              <MenuItem value={10}>10 Ticks</MenuItem>
              <MenuItem value={20}>20 Ticks</MenuItem>
              <MenuItem value={50}>50 Ticks</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Chart */}
      {isLoading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">Loading OHLC data...</Typography>
        </Box>
      ) : ohlcData.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            No OHLC data available for {selectedSymbol}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={ohlcData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Volume bars in background */}
              <Bar
                dataKey="volume"
                fill="#8884d8"
                fillOpacity={0.2}
                yAxisId="volume"
              />

              {/* OHLC lines */}
              <Line
                type="monotone"
                dataKey="high"
                stroke="#00C851"
                strokeWidth={2}
                dot={false}
                name="High"
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="#FF4444"
                strokeWidth={2}
                dot={false}
                name="Low"
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#FF7300"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Close"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Chart Summary */}
      {ohlcData.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <Paper sx={{ p: 1, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Candles
              </Typography>
              <Typography variant="h6">{ohlcData.length}</Typography>
            </Paper>
            <Paper sx={{ p: 1, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Period High
              </Typography>
              <Typography variant="h6" color="success.main">
                ${Math.max(...ohlcData.map((d) => d.high)).toFixed(2)}
              </Typography>
            </Paper>
            <Paper sx={{ p: 1, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Period Low
              </Typography>
              <Typography variant="h6" color="error.main">
                ${Math.min(...ohlcData.map((d) => d.low)).toFixed(2)}
              </Typography>
            </Paper>
            <Paper sx={{ p: 1, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Total Change
              </Typography>
              <Typography
                variant="h6"
                color={
                  ohlcData[ohlcData.length - 1].close > ohlcData[0].open
                    ? "success.main"
                    : "error.main"
                }
              >
                {ohlcData[ohlcData.length - 1].close > ohlcData[0].open
                  ? "+"
                  : ""}
                $
                {(
                  ohlcData[ohlcData.length - 1].close - ohlcData[0].open
                ).toFixed(2)}
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OHLCChart;
