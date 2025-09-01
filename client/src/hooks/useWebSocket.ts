import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addTick, setConnected } from "../store/slices/tickerSlice";
import { setConnectionStatus, addNotification } from "../store/slices/uiSlice";
import type { WebSocketMessage } from "../types/api";

const WS_URL = "ws://localhost:3001/ws/ticks";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const { selectedSymbol } = useAppSelector((state) => state.symbols);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    dispatch(setConnectionStatus("connecting"));

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        dispatch(setConnected(true));
        dispatch(setConnectionStatus("connected"));
        dispatch(
          addNotification({
            type: "success",
            message: "Connected to live data feed",
            duration: 3000,
          })
        );
        reconnectAttemptsRef.current = 0;

        // Subscribe to selected symbol if available
        if (selectedSymbol) {
          ws.send(
            JSON.stringify({
              action: "subscribe",
              symbol: selectedSymbol,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "tick":
              if (message.data) {
                dispatch(addTick(message.data));
              }
              break;
            case "error":
              console.error("WebSocket error:", message.error);
              dispatch(
                addNotification({
                  type: "error",
                  message: message.error || "WebSocket error occurred",
                  duration: 5000,
                })
              );
              break;
            case "subscribed":
              console.log("Subscribed to:", message.symbol);
              break;
            case "unsubscribed":
              console.log("Unsubscribed from:", message.symbol);
              break;
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        dispatch(setConnected(false));
        dispatch(setConnectionStatus("disconnected"));

        // Attempt to reconnect if not closed intentionally
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          dispatch(setConnectionStatus("reconnecting"));
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`
            );
            connect();
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          dispatch(
            addNotification({
              type: "error",
              message: "Failed to reconnect to live data feed",
              duration: 5000,
            })
          );
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        dispatch(
          addNotification({
            type: "error",
            message: "Connection error occurred",
            duration: 5000,
          })
        );
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      dispatch(setConnectionStatus("disconnected"));
      dispatch(
        addNotification({
          type: "error",
          message: "Failed to connect to live data feed",
          duration: 5000,
        })
      );
    }
  }, [dispatch, selectedSymbol]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    dispatch(setConnected(false));
    dispatch(setConnectionStatus("disconnected"));
  }, [dispatch]);

  const subscribe = useCallback((symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "subscribe",
          symbol,
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "unsubscribe",
          symbol,
        })
      );
    }
  }, []);

  // Auto-connect on mount and subscribe to selected symbol changes
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Handle symbol changes
  useEffect(() => {
    if (selectedSymbol && wsRef.current?.readyState === WebSocket.OPEN) {
      // Note: For simplicity, we're not unsubscribing from previous symbols
      // In a production app, you might want to manage multiple subscriptions
      subscribe(selectedSymbol);
    }
  }, [selectedSymbol, subscribe]);

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
