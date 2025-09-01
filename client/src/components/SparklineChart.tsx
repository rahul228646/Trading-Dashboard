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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useAppSelector } from "../store/hooks";
import { useGetTickHistoryQuery } from "../store/api";

interface SparklineChartProps {
  variant?: "line" | "area";
  height?: number;
  showAxis?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  color?: string;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  variant = "line",
  height = 200,
  showAxis = true,
  showGrid = false,
  showTooltip = true,
  color = "#8884d8",
}) => {
  const selectedSymbol = useAppSelector(
    (state) => (state as any).symbols?.selectedSymbol
  );
  const connectionStatus = useAppSelector(
    (state) => (state as any).ui?.connectionStatus || "disconnected"
  );

  const [timeRange, setTimeRange] = React.useState(50);

  const {
    data: tickHistory,
    isLoading,
    error,
  } = useGetTickHistoryQuery(
    { symbol: selectedSymbol || "", limit: timeRange },
    { skip: !selectedSymbol, refetchOnMountOrArgChange: true }
  );

  // Format data for recharts
  const chartData = React.useMemo(() => {
    if (!tickHistory || tickHistory.length === 0) return [];

    return tickHistory.map((tick, index) => ({
      index,
      price: tick.price,
      volume: tick.volume,
      timestamp: tick.timestamp,
      time: new Date(tick.timestamp * 1000).toLocaleTimeString(),
      change: index > 0 ? tick.price - tickHistory[index - 1].price : 0,
    }));
  }, [tickHistory]);

  // Calculate price range for better Y-axis scaling
  const priceRange = React.useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 };

    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;

    return {
      min: min - padding,
      max: max + padding,
    };
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1, fontSize: "0.875rem" }}>
          <Typography variant="body2">Time: {data.time}</Typography>
          <Typography variant="body2">
            Price: ${data.price.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            Volume: {data.volume.toLocaleString()}
          </Typography>
          {data.change !== 0 && (
            <Typography
              variant="body2"
              color={data.change > 0 ? "success.main" : "error.main"}
            >
              Change: {data.change > 0 ? "+" : ""}${data.change.toFixed(2)}
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  if (!selectedSymbol) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h6" gutterBottom>
          Price Chart
        </Typography>
        <Typography color="text.secondary">
          Please select a symbol to view price chart
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h6" gutterBottom>
          Price Chart - {selectedSymbol}
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
          <Typography variant="h6">{selectedSymbol} Price Chart</Typography>
          <Chip
            label={connectionStatus.toUpperCase()}
            color={connectionStatus === "connected" ? "success" : "warning"}
            size="small"
          />
        </Box>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <MenuItem value={20}>Last 20</MenuItem>
            <MenuItem value={50}>Last 50</MenuItem>
            <MenuItem value={100}>Last 100</MenuItem>
            <MenuItem value={200}>Last 200</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Chart */}
      {isLoading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">Loading chart data...</Typography>
        </Box>
      ) : chartData.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            No chart data available for {selectedSymbol}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {variant === "area" ? (
              <AreaChart data={chartData}>
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                )}
                {showAxis && (
                  <>
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[priceRange.min, priceRange.max]}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                  </>
                )}
                {showTooltip && <Tooltip content={<CustomTooltip />} />}
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                )}
                {showAxis && (
                  <>
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[priceRange.min, priceRange.max]}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                  </>
                )}
                {showTooltip && <Tooltip content={<CustomTooltip />} />}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
      )}

      {/* Chart Info */}
      {chartData.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip
            label={`${chartData.length} data points`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Range: $${priceRange.min.toFixed(
              2
            )} - $${priceRange.max.toFixed(2)}`}
            variant="outlined"
            size="small"
          />
          {chartData.length >= 2 && (
            <Chip
              label={`Total Change: ${
                chartData[chartData.length - 1].price > chartData[0].price
                  ? "+"
                  : ""
              }$${(
                chartData[chartData.length - 1].price - chartData[0].price
              ).toFixed(2)}`}
              variant="outlined"
              size="small"
              color={
                chartData[chartData.length - 1].price > chartData[0].price
                  ? "success"
                  : "error"
              }
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default SparklineChart;
