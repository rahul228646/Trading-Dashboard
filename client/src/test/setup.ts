import "@testing-library/jest-dom";

// Mock WebSocket for testing
Object.assign(global, {
  WebSocket: class MockWebSocket {
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    readyState = 0; // CONNECTING
    url: string;

    constructor(url: string) {
      this.url = url;
      setTimeout(() => {
        this.readyState = 1; // OPEN
        if (this.onopen) {
          this.onopen(new Event("open"));
        }
      }, 0);
    }

    send(_data: string) {
      // Mock send functionality
    }

    close() {
      this.readyState = 3; // CLOSED
      if (this.onclose) {
        this.onclose(new CloseEvent("close"));
      }
    }

    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
  },
});
