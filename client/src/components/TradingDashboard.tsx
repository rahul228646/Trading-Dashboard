import React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  AppBar,
  Toolbar,
} from "@mui/material";
import { useAppSelector } from "../store/hooks";
import { useWebSocket } from "../hooks/useWebSocket";
import SymbolSelector from "./SymbolSelector";
import LiveTicker from "./LiveTicker";
import OrderForm from "./OrderForm";
import OrdersTable from "./OrdersTable";

const TradingDashboard: React.FC = () => {
  const connectionStatus = useAppSelector(
    (state) => (state as any).ui?.connectionStatus || "disconnected"
  );

  // Initialize WebSocket connection
  useWebSocket();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Live Trading Dashboard
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color:
                  connectionStatus === "connected" ? "lightgreen" : "orange",
                fontWeight: "bold",
              }}
            >
              {connectionStatus.toUpperCase()}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Symbol Selector */}
          <Paper sx={{ p: 2 }}>
            <SymbolSelector />
          </Paper>

          {/* Main content row */}
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {/* Live Ticker */}
            <Paper sx={{ p: 2, flex: "1 1 400px", minWidth: 0 }}>
              <LiveTicker />
            </Paper>

            {/* Order Form */}
            <Paper sx={{ p: 2, flex: "0 0 300px" }}>
              <OrderForm />
            </Paper>
          </Box>

          {/* Orders Table */}
          <Paper sx={{ p: 2 }}>
            <OrdersTable />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default TradingDashboard;
