# TradeGuardAI Backend

Backend API server for the TradeGuardAI cryptocurrency trading platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Prisma ORM
- **Caching**: In-memory (node-cache) - Redis ready for production
- **Authentication**: Handled by Memberstack (frontend)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier available)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Setup database** (optional for MVP)
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start the server**
   ```bash
   # Development with hot-reload
   npm run dev

   # Production
   npm start
   ```

The server will start at `http://localhost:5000`

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status and available endpoints |
| GET | `/api/health/ping` | Simple ping/pong |

### Cryptocurrency Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crypto/list` | Top cryptocurrencies (paginated) |
| GET | `/api/crypto/trending` | Trending cryptocurrencies |
| GET | `/api/crypto/:symbol` | Details for a specific crypto |
| GET | `/api/crypto/:symbol/history` | Price history (OHLCV) |
| GET | `/api/crypto/logo/:symbol` | Logo image (proxied) |

### Market Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/summary` | BTC, ETH prices + market overview |
| GET | `/api/market/fear-greed` | Fear & Greed Index |
| GET | `/api/market/tickers` | Multiple tickers at once |

## Query Parameters

### `/api/crypto/list`
- `page` (default: 1) - Page number
- `limit` (default: 100, max: 250) - Items per page

### `/api/crypto/:symbol/history`
- `interval` (default: "1h") - Candlestick interval (1m, 5m, 15m, 1h, 4h, 1d)
- `limit` (default: 100, max: 1000) - Number of candles

### `/api/market/tickers`
- `symbols` (default: "BTC,ETH,SOL") - Comma-separated symbols

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `COINGECKO_API_KEY` | CoinGecko API key (optional) | - |
| `CACHE_TTL_CRYPTO_LIST` | Crypto list cache (seconds) | 120 |
| `CACHE_TTL_MARKET_SUMMARY` | Market summary cache (seconds) | 30 |
| `CACHE_TTL_CRYPTO_DETAILS` | Crypto details cache (seconds) | 60 |

## Project Structure

```
Backend/
├── src/
│   ├── server.js           # Express app entry point
│   ├── routes/
│   │   ├── health.js       # Health check endpoints
│   │   ├── crypto.js       # Cryptocurrency endpoints
│   │   └── market.js       # Market data endpoints
│   ├── services/
│   │   ├── binanceService.js    # Binance API integration
│   │   └── coingeckoService.js  # CoinGecko API integration
│   └── utils/
│       └── cache.js        # In-memory caching
├── prisma/
│   └── schema.prisma       # Database schema
├── .env.example            # Environment template
├── package.json
└── README.md
```

## Future Endpoints (Planned)

### Predictions (AI/ML)
```
GET  /api/predictions/:symbol        # Get latest prediction
GET  /api/predictions/:symbol/history # Prediction history
GET  /api/predictions/accuracy       # Model accuracy metrics
```

### Portfolio
```
GET    /api/portfolio                # User's portfolio
POST   /api/portfolio/holdings       # Add holding
PUT    /api/portfolio/holdings/:id   # Update holding
DELETE /api/portfolio/holdings/:id   # Remove holding
GET    /api/portfolio/performance    # Portfolio analytics
```

### Resources
```
GET  /api/resources              # List articles
GET  /api/resources/:slug        # Single article
```

### Alerts
```
GET    /api/alerts               # User's alerts
POST   /api/alerts               # Create alert
DELETE /api/alerts/:id           # Delete alert
```

## Rate Limiting

- 100 requests per minute per IP
- Cached responses don't count against limit

## Caching Strategy

| Data | TTL | Reason |
|------|-----|--------|
| Crypto List | 2 min | Prices change frequently |
| Market Summary | 30 sec | Real-time relevance |
| Crypto Details | 1 min | Balance freshness/performance |
| Trending | 5 min | Changes slowly |
| Logos | 24 hours | Rarely change |
| Fear & Greed | 10 min | Updated infrequently |

## Error Handling

All errors return JSON in this format:
```json
{
  "error": "Error message",
  "status": 500,
  "stack": "..." // Only in development
}
```

## External APIs

1. **Binance Public API** - Real-time price data, order books, trades
2. **CoinGecko API** - Market data, metadata, logos
3. **Alternative.me** - Fear & Greed Index

## Development

```bash
# Run with hot-reload
npm run dev

# View database
npm run db:studio

# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Deployment

### Railway / Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Docker (coming soon)
```bash
docker build -t tradeguard-backend .
docker run -p 5000:5000 tradeguard-backend
```

## License

ISC
