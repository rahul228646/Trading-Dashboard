// UI-specific types
export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [field: string]: string;
}

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "reconnecting";

export type OrderFilter = "ALL" | "BUY" | "SELL";

export interface TableSort {
  field: string;
  direction: "asc" | "desc";
}

export interface DashboardLayout {
  isMobile: boolean;
  isTablet: boolean;
  sidebarOpen: boolean;
}
