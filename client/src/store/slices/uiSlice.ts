import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  Notification,
  LoadingState,
  ConnectionStatus,
  DashboardLayout,
} from "../../types/ui";

interface UIState {
  notifications: Notification[];
  loading: LoadingState;
  connectionStatus: ConnectionStatus;
  layout: DashboardLayout;
  theme: "light" | "dark";
  errors: Record<string, string>; // field -> error message
}

const initialState: UIState = {
  notifications: [],
  loading: { isLoading: false },
  connectionStatus: "disconnected",
  layout: {
    isMobile: false,
    isTablet: false,
    sidebarOpen: true,
  },
  theme: "light",
  errors: {},
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id">>
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    setLoading: (state, action: PayloadAction<LoadingState>) => {
      state.loading = action.payload;
    },

    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },

    setLayout: (state, action: PayloadAction<Partial<DashboardLayout>>) => {
      state.layout = { ...state.layout, ...action.payload };
    },

    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },

    setError: (
      state,
      action: PayloadAction<{ field: string; message: string }>
    ) => {
      state.errors[action.payload.field] = action.payload.message;
    },

    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },

    clearAllErrors: (state) => {
      state.errors = {};
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setConnectionStatus,
  setLayout,
  setTheme,
  setError,
  clearError,
  clearAllErrors,
} = uiSlice.actions;

export default uiSlice.reducer;
