# CandleChart (integration)

This project splits the UI component and the chart logic:

- `src/Components/CandleChart/CandleChart.jsx` — React component (small) which only renders the DOM nodes and calls the JS module on mount.
- `src/Components/CandleChart/CandleChart.js` — the chart logic (historical REST + websocket + lightweight-charts) kept in plain JS and exported as `initCandleChart`.

Before running the app, install the runtime dependency:

```bash
npm install lightweight-charts
```

Usage (example):

```jsx
import CandleChart from './src/Components/CandleChart/CandleChart'

function App(){
  return <CandleChart symbol="BTCUSDT" interval="1m" height={400} />
}
```

Notes:
- `CandleChart.js` uses the Binance REST and WebSocket endpoints; depending on your environment you may need to configure CORS or run a proxy.
- The module returns an object with `destroy()` — the component calls this when it unmounts to clean up sockets and chart resources.
