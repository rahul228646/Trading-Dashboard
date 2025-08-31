# Trading Dashboard

A real-time trading dashboard application built with React (frontend) and Node.js/Express (backend)


## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Assignment
```

### 2. Install Dependencies

#### Backend Setup

```bash
cd server
npm install
```

#### Frontend Setup

```bash
cd ../client
npm install
```

### 3. Environment Configuration

#### Backend Configuration

Create a `.env` file in the `server` directory (optional - defaults will be used):

```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

# Data Directory
DATA_DIR=./data

# Tick Generation Settings
TICK_INTERVAL_MIN=1000
TICK_INTERVAL_MAX=2000

```

### 4. Start the Application

#### Start Backend Server

```bash
cd server
npm run dev
```

#### Start Frontend Client (in a new terminal)

```bash
cd client
npm run dev
```

## 🧪 How to Run Tests

### Frontend Tests (Vitest + React Testing Library)

```bash
cd client

# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```


### Backend Tests (Jest)

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```



### Full Test Suite

To run all tests for both frontend and backend:

```bash
# From project root
cd server && npm test && cd ../client && npm test
```

## 📡 API Usage Examples

### REST API Endpoints

#### 1. Get Available Symbols

```bash
GET http://localhost:{PORT}/api/symbols

# Response:
{
  "symbols": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "lastPrice": 150.25,
      "lastUpdate": "2025-08-31T10:30:00.000Z"
    }
  ]
}
```

#### 2. Create Order

```bash
POST http://localhost:{PORT}/api/orders
Content-Type: application/json

{
  "symbol": "AAPL",
  "quantity": 100,
  "price": 150.50,
  "type": "buy"
}

# Response:
{
  "id": "uuid-string",
  "symbol": "AAPL",
  "quantity": 100,
  "price": 150.50,
  "type": "buy",
  "status": "pending",
  "timestamp": "2025-08-31T10:30:00.000Z"
}
```

#### 3. Get Orders

```bash
GET http://localhost:{PORT}/api/orders

# Response:
{
  "orders": [
    {
      "id": "uuid-string",
      "symbol": "AAPL",
      "quantity": 100,
      "price": 150.50,
      "type": "buy",
      "status": "filled",
      "timestamp": "2025-08-31T10:30:00.000Z"
    }
  ]
}
```

### WebSocket API

#### Real-time Price Ticks

```javascript
// Connect to WebSocket
const ws = new WebSocket("ws://localhost:{PORT}/ws/ticks");

// Listen for price updates
ws.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  console.log(tick);
  // {
  //   symbol: "AAPL",
  //   price: 150.75,
  //   timestamp: "2025-08-31T10:30:00.000Z",
  //   change: 0.50,
  //   changePercent: 0.33
  // }
};
```

