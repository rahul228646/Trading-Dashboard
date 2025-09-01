import React from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { ShowChart, Equalizer, Timeline } from "@mui/icons-material";
import SparklineChart from "./SparklineChart";
import OHLCChart from "./OHLCChart";
import { useAppSelector } from "../store/hooks";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chart-tabpanel-${index}`}
      aria-labelledby={`chart-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `chart-tab-${index}`,
    "aria-controls": `chart-tabpanel-${index}`,
  };
}

const ChartDisplay: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [chartVariant, setChartVariant] = React.useState<"line" | "area">(
    "line"
  );
  const [chartHeight, setChartHeight] = React.useState(300);

  const selectedSymbol = useAppSelector(
    (state) => (state as any).symbols?.selectedSymbol
  );
  const connectionStatus = useAppSelector(
    (state) => (state as any).ui?.connectionStatus || "disconnected"
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!selectedSymbol) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <ShowChart sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Chart Display
        </Typography>
        <Typography color="text.secondary">
          Please select a symbol to view price charts
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
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
          <Typography variant="h6">{selectedSymbol} Charts</Typography>
          <Chip
            label={connectionStatus.toUpperCase()}
            color={connectionStatus === "connected" ? "success" : "warning"}
            size="small"
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Style</InputLabel>
            <Select
              value={chartVariant}
              label="Style"
              onChange={(e) =>
                setChartVariant(e.target.value as "line" | "area")
              }
            >
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="area">Area</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Height</InputLabel>
            <Select
              value={chartHeight}
              label="Height"
              onChange={(e) => setChartHeight(Number(e.target.value))}
            >
              <MenuItem value={200}>Small</MenuItem>
              <MenuItem value={300}>Medium</MenuItem>
              <MenuItem value={400}>Large</MenuItem>
              <MenuItem value={500}>X-Large</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="chart tabs"
        >
          <Tab
            icon={<Timeline />}
            label="Sparkline"
            {...a11yProps(0)}
            iconPosition="start"
          />
          <Tab
            icon={<Equalizer />}
            label="OHLC"
            {...a11yProps(1)}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <SparklineChart
          variant={chartVariant}
          height={chartHeight}
          showAxis={true}
          showGrid={true}
          showTooltip={true}
          color={chartVariant === "area" ? "#8884d8" : "#FF7300"}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <OHLCChart height={chartHeight} candleInterval={10} />
      </TabPanel>

      {/* Chart Description */}
      <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        {tabValue === 0 ? (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              About Sparkline Charts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sparkline charts show price movement over time in a compact
              format. Perfect for quickly identifying trends and patterns in
              real-time tick data. Switch between line and area styles to
              highlight different aspects of the data.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              About OHLC Charts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              OHLC (Open, High, Low, Close) charts aggregate tick data into
              intervals, showing the opening price, highest price, lowest price,
              and closing price for each time period. Useful for technical
              analysis and identifying price patterns.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ChartDisplay;
