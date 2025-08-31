import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useAppSelector } from "../store/hooks";
import { useGetOrdersQuery } from "../store/api";

type OrderSortField = "timestamp" | "symbol" | "price" | "qty" | "side";
type SortDirection = "asc" | "desc";

const OrdersTable: React.FC = () => {
  const selectedSymbol = useAppSelector(
    (state) => state.symbols.selectedSymbol
  );
  const [sortField, setSortField] = useState<OrderSortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: orders = [],
    isLoading,
    error,
  } = useGetOrdersQuery(selectedSymbol || "", {
    skip: !selectedSymbol,
    pollingInterval: 5000,
  });

  const handleSort = (field: OrderSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = orders.filter(
        (order) =>
          order.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.side.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort - create a copy first to avoid mutating the original array
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "timestamp") {
        // Handle Unix timestamp (seconds) - convert to milliseconds for comparison
        aVal = Number(aVal) * 1000;
        bVal = Number(bVal) * 1000;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, searchTerm, sortField, sortDirection]);

  const getTypeColor = (type: string) => {
    return type === "BUY" ? "primary" : "secondary";
  };

  if (!selectedSymbol) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Orders
        </Typography>
        <Alert severity="info">Please select a symbol to view orders</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Orders for {selectedSymbol}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error ? (
        <Alert severity="error">Failed to load orders</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "timestamp"}
                    direction={
                      sortField === "timestamp" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("timestamp")}
                  >
                    Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "side"}
                    direction={sortField === "side" ? sortDirection : "asc"}
                    onClick={() => handleSort("side")}
                  >
                    Side
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === "qty"}
                    direction={sortField === "qty" ? sortDirection : "asc"}
                    onClick={() => handleSort("qty")}
                  >
                    Quantity
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === "price"}
                    direction={sortField === "price" ? sortDirection : "asc"}
                    onClick={() => handleSort("price")}
                  >
                    Price
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {searchTerm
                      ? "No orders found matching search"
                      : "No orders found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOrders.map((order, index) => (
                  <TableRow
                    key={`${order.id}-${order.timestamp}-${index}`}
                    hover
                  >
                    <TableCell>
                      {new Date(order.timestamp * 1000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.side}
                        size="small"
                        color={getTypeColor(order.side) as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {order.qty.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${order.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default OrdersTable;
