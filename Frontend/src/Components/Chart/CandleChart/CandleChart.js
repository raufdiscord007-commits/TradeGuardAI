import * as LightweightCharts from 'lightweight-charts'
const { createChart } = LightweightCharts

/**
 * Format currency values with subscript notation for leading zeros
 */
function formatCurrency(value) {
    const num = parseFloat(value)
    if (isNaN(num)) return '$0.00'
    
    // For very small values, use subscript notation for leading zeros
    if (num > 0 && num < 1) {
        const str = num.toString()
        const match = str.match(/^0\.(0+)([1-9]\d*)/)
        
        if (match && match[1].length >= 4) {
            // Use subscript notation: $0.0₍₅₎57874
            const leadingZeros = match[1].length
            const subscriptZeros = leadingZeros.toString().split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')
            const significantDigits = match[2].substring(0, 5)
            return `$0.0₍${subscriptZeros}₎${significantDigits}`
        }
        
        // For smaller numbers of leading zeros, show more decimals
        if (num < 0.01) {
            return `$${num.toFixed(8).replace(/\.?0+$/, '')}`
        }
        return `$${num.toFixed(6).replace(/\.?0+$/, '')}`
    }
    
    // For values >= 1, use standard formatting
    return `$${num.toFixed(2)}`
}

/**
 * Module to initialise a lightweight-candlestick chart and connect it to
 * Binance REST + websocket. Kept as a separate JS file (not JSX) so it can
 * run independently and be imported by the React component.
 *
 * Usage:
 *   import { initBinanceCandleChart } from './CandleChart'
 *   const destroy = initBinanceCandleChart(chartContainerEl, priceEl, { symbol, interval, pageLimit, height })
 *   // when unmounting call destroy()
 */

export function initBinanceCandleChart(containerEl, priceEl, opts = {}) {
    const SYMBOL = (opts.symbol || 'BTCUSDT').toUpperCase()
    const SYMBOLLOWER = SYMBOL.toLowerCase()
    const INTERVAL = opts.interval || '1m'
    const PAGE_LIMIT = opts.pageLimit || 50
    const height = opts.height || 400
    console.log('[CandleChart.js] initBinanceCandleChart', { SYMBOL, INTERVAL, PAGE_LIMIT, height, opts });

    if (!containerEl) {
        console.error('[CandleChart.js] containerEl required but missing!');
        throw new Error('containerEl required')
    }

    let candles = []
    let isLoadingOlder = false
    let noMoreHistorical = false
    let lastprice = null

    const chart = createChart(containerEl, {
        width: containerEl.clientWidth,
        height,
        layout: {
            background: { color: 'white' },
            textColor: 'black',
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
        grid: {
            vertLines: { color: '#ccc' },
            horzLines: { color: '#ccc' },
        },
    })

    // Setting the border color for the vertical axis (use explicit scale id)
    chart.priceScale('right').applyOptions({
        borderColor: '#ccc',
    });

    // Setting the border color for the horizontal axis
    chart.timeScale().applyOptions({
        borderColor: '#ccc',
    });

    // Create an area series first (will appear beneath the candlesticks)
    let areaSeries
    try {
        if (LightweightCharts?.AreaSeries) {
            areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
                lastValueVisible: false, // hide the last value marker for this series
                crosshairMarkerVisible: false, // hide the crosshair marker for this series
                lineColor: 'transparent', // hide the line
                topColor: 'rgb(30 101 250)',
                bottomColor: 'rgba(255, 255, 255, 0)',
            })
        } else if (typeof chart.addAreaSeries === 'function') {
            areaSeries = chart.addAreaSeries({
                lastValueVisible: false,
                crosshairMarkerVisible: false,
                lineColor: 'transparent',
                topColor: 'rgb(30 101 250)',
                bottomColor: 'rgba(255, 255, 255, 0)',
            })
        }
    } catch (err) {
        console.warn('Could not create area series:', err)
    }

    // Helper function to calculate moving average from candlestick data
    function calculateMovingAverageSeriesData(candleData, maLength) {
        const maData = []

        for (let i = 0; i < candleData.length; i++) {
            if (i < maLength) {
                // Provide whitespace data points until the MA can be calculated
                maData.push({ time: candleData[i].time })
            } else {
                // Calculate the moving average
                let sum = 0
                for (let j = 0; j < maLength; j++) {
                    sum += candleData[i - j].close
                }
                const maValue = sum / maLength
                maData.push({ time: candleData[i].time, value: maValue })
            }
        }

        return maData
    }

    // Create a moving average line series
    const MA_LENGTH = opts.maLength || 20
    let maSeries
    try {
        if (LightweightCharts?.LineSeries) {
            maSeries = chart.addSeries(LightweightCharts.LineSeries, {
                color: '#1e65fa',
                lineWidth: 2,
                lastValueVisible: true,
                priceLineVisible: false,
            })
        } else if (typeof chart.addLineSeries === 'function') {
            maSeries = chart.addLineSeries({
                color: '#1e65fa',
                lineWidth: 2,
                lastValueVisible: true,
                priceLineVisible: false,
            })
        }
    } catch (err) {
        console.warn('Could not create moving average series:', err)
    }

    // Custom price formatter for the Y-axis
    const priceFormatter = (price) => {
        const num = parseFloat(price)
        if (isNaN(num)) return '0.00'
        
        // For very small values, use subscript notation for leading zeros
        if (num > 0 && num < 1) {
            const str = num.toString()
            const match = str.match(/^0\.(0+)([1-9]\d*)/)
            
            if (match && match[1].length >= 4) {
                const leadingZeros = match[1].length
                const subscriptZeros = leadingZeros.toString().split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')
                const significantDigits = match[2].substring(0, 5)
                return `0.0₍${subscriptZeros}₎${significantDigits}`
            }
            
            if (num < 0.01) {
                return num.toFixed(8).replace(/\.?0+$/, '')
            }
            return num.toFixed(6).replace(/\.?0+$/, '')
        }
        
        return num.toFixed(2)
    }

    // Create a candlestick series. Different library versions expose
    // different helpers: prefer addCandlestickSeries, otherwise fall back
    // to addSeries('Candlestick', options) which works in some builds.
    let candleSeries
    const candleOptions = {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceFormat: {
            type: 'custom',
            formatter: priceFormatter,
        },
    }

    if (typeof chart.addCandlestickSeries === 'function') {
        candleSeries = chart.addCandlestickSeries(candleOptions)
        } else if (typeof chart.addSeries === 'function') {
        try {
                        // some builds expect the series constructor (e.g. LightweightCharts.CandlestickSeries)
                        if (LightweightCharts?.CandlestickSeries) {
                            candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, candleOptions)
                        } else {
                            // string name fallback (less reliable)
                            candleSeries = chart.addSeries('Candlestick', candleOptions)
                        }
        } catch (err) {
            try {
                // or the implementation may expect a series descriptor (older global API)
                // we attempt to access a constructor-like export from the package if available
                // (chart.addSeries(CandlestickSeries, opts) used to work in some contexts)
                // This block will likely never run in modern ESM builds but is here as a fallback.
                // eslint-disable-next-line no-undef
                candleSeries = chart.addSeries(window?.LightweightCharts?.CandlestickSeries, candleOptions)
            } catch (err2) {
                // give up — at runtime this will surface further errors, but we try best effort
                // eslint-disable-next-line no-console
                console.error('Failed to create candlestick series', err2)
                throw err2
            }
        }
    } else {
        throw new Error('Unsupported chart API: cannot add candlestick series')
    }

    // Helper to convert Binance kline array to lightweight-charts data point
    function klineArrayToPoint(k) {
    // Binance kline array indices: 0=openTime,1=open,2=high,3=low,4=close,5=volume
    return {
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4])
    };
}

    async function loadInitial() {
        try {
            const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=${PAGE_LIMIT}`
            console.log('[CandleChart.js] Fetching initial klines:', url);
            const r = await fetch(url)
            const json = await r.json()
            const initial = Array.isArray(json) ? json.map(klineArrayToPoint) : []
            console.log('[CandleChart.js] Initial klines result:', initial);
            if (!initial.length) {
                console.warn('[CandleChart.js] No initial kline data received!');
                return
            }
            candles = initial
            // Convert candlestick data for area series
            const lineData = candles.map(datapoint => ({
                time: datapoint.time,
                value: (datapoint.close + datapoint.open) / 2,
            }))
            // Set data for area series if it exists
            if (areaSeries) {
                areaSeries.setData(lineData)
            }
            // Calculate and set moving average data
            if (maSeries) {
                const maData = calculateMovingAverageSeriesData(candles, MA_LENGTH)
                maSeries.setData(maData)
            }
            // Set data for candlestick series
            candleSeries.setData(candles)
            chart.timeScale().fitContent()
            const last = candles[candles.length - 1]
            if (last && priceEl) {
                priceEl.innerText = formatCurrency(last.close)
            }
            lastprice = last?.close ?? null
        } catch (err) {
            console.error('[CandleChart.js] Failed loading historical klines:', err)
        }
    }

    // WebSocket with reconnect/backoff logic for real-time kline updates
    let ws = null
    let reconnectAttempts = 0
    let reconnectTimer = null
    let destroyed = false
    let pollingTimer = null
    const POLLING_INTERVAL = opts.pollingIntervalMs || 5000
    const POLL_AFTER_ATTEMPTS = 3
    let connectTimer = null

    function handleWsMessage(event) {
        try {
            const payload = JSON.parse(event.data)
            // Stream endpoint wraps data in a 'data' field with 'stream' name
            const eventData = payload.data || payload
            const k = eventData.k
            if (!k) {
                console.warn('Received message without kline data:', payload)
                return
            }
            const point = {
                time: Math.floor(k.t / 1000),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            }

            // update the series and local cache
            candleSeries.update(point)
            
            // Update area series with the average of open and close
            if (areaSeries) {
                const areaPoint = {
                    time: point.time,
                    value: (point.close + point.open) / 2,
                }
                areaSeries.update(areaPoint)
            }
            
            if (candles.length && candles[candles.length - 1].time === point.time) {
                candles[candles.length - 1] = point
            } else {
                candles.push(point)
            }

            // Update moving average
            if (maSeries && candles.length >= MA_LENGTH) {
                // Calculate MA for the latest point
                let sum = 0
                for (let j = 0; j < MA_LENGTH; j++) {
                    sum += candles[candles.length - 1 - j].close
                }
                const maValue = sum / MA_LENGTH
                maSeries.update({ time: point.time, value: maValue })
            }

            if (priceEl) {
                priceEl.innerText = formatCurrency(point.close)
                try {
                    priceEl.style.color = !lastprice || lastprice === point.close ? 'black' : point.close > lastprice ? 'green' : 'red'
                } catch (err) {}
            }
            lastprice = point.close
        } catch (e) {
            console.error('ws message parse error', e)
        }
    }

    // Poll REST API as a fallback when WS repeatedly fails
    function startPolling() {
        if (pollingTimer || destroyed) return
        console.warn(`🔄 Starting REST polling fallback every ${POLLING_INTERVAL}ms`)
        pollingTimer = setInterval(async () => {
            try {
                const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=2`
                const r = await fetch(url)
                const json = await r.json()
                if (!Array.isArray(json) || json.length === 0) return
                const lastRaw = json[json.length - 1]
                const last = klineArrayToPoint(lastRaw)

                // apply the same update logic as websocket
                const areaPoint = { time: last.time, value: (last.close + last.open) / 2 }
                if (candles.length && candles[candles.length - 1].time === last.time) {
                    candles[candles.length - 1] = last
                    try { candleSeries.update(last) } catch (err) { candleSeries.setData(candles) }
                    if (areaSeries) {
                        try { areaSeries.update(areaPoint) } catch (err) { 
                            const lineData = candles.map(dp => ({ time: dp.time, value: (dp.close + dp.open) / 2 }))
                            areaSeries.setData(lineData) 
                        }
                    }
                    // Update MA
                    if (maSeries && candles.length >= MA_LENGTH) {
                        let sum = 0
                        for (let j = 0; j < MA_LENGTH; j++) {
                            sum += candles[candles.length - 1 - j].close
                        }
                        const maValue = sum / MA_LENGTH
                        try { maSeries.update({ time: last.time, value: maValue }) } catch (err) {
                            const maData = calculateMovingAverageSeriesData(candles, MA_LENGTH)
                            maSeries.setData(maData)
                        }
                    }
                } else {
                    candles.push(last)
                    try { candleSeries.update(last) } catch (err) { candleSeries.setData(candles) }
                    if (areaSeries) {
                        try { areaSeries.update(areaPoint) } catch (err) { 
                            const lineData = candles.map(dp => ({ time: dp.time, value: (dp.close + dp.open) / 2 }))
                            areaSeries.setData(lineData) 
                        }
                    }
                    // Update MA
                    if (maSeries && candles.length >= MA_LENGTH) {
                        let sum = 0
                        for (let j = 0; j < MA_LENGTH; j++) {
                            sum += candles[candles.length - 1 - j].close
                        }
                        const maValue = sum / MA_LENGTH
                        try { maSeries.update({ time: last.time, value: maValue }) } catch (err) {
                            const maData = calculateMovingAverageSeriesData(candles, MA_LENGTH)
                            maSeries.setData(maData)
                        }
                    }
                }

                if (priceEl) {
                    priceEl.innerText = formatCurrency(last.close)
                    try { priceEl.style.color = !lastprice || lastprice === last.close ? 'black' : last.close > lastprice ? 'green' : 'red' } catch (e) {}
                }
                lastprice = last.close
            } catch (e) {
                console.error('polling error', e)
            }
        }, POLLING_INTERVAL)
    }

    function stopPolling() {
        if (!pollingTimer) return
        clearInterval(pollingTimer)
        pollingTimer = null
    }

    function connectWebSocket() {
        if (destroyed) return
        // debounce actual socket creation to avoid quick mount/unmount races (React StrictMode)
        if (connectTimer) clearTimeout(connectTimer)
        connectTimer = setTimeout(() => {
            if (destroyed) return
            const url = `wss://stream.binance.com:443/stream?streams=${SYMBOLLOWER}@kline_${INTERVAL}`
            try {
                ws = new WebSocket(url)
            } catch (err) {
                // creation failed synchronously
                if (reconnectAttempts > 0) console.warn('WebSocket creation failed', err)
                scheduleReconnect()
                return
            }

            ws.onopen = () => {
                reconnectAttempts = 0
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer)
                    reconnectTimer = null
                }
                stopPolling()
            }

            ws.onmessage = handleWsMessage

            ws.onerror = (err) => {
                if (reconnectAttempts > 0) console.warn('WebSocket error after', reconnectAttempts, 'attempts')
            }

            ws.onclose = (ev) => {
                if (destroyed) return
                if (reconnectAttempts > 0 && ev?.code !== 1000) {
                    console.warn('WebSocket closed unexpectedly:', ev?.code, ev?.reason)
                }
                scheduleReconnect()
            }
        }, 120)
    }

    function scheduleReconnect() {
        if (destroyed) return
        reconnectAttempts += 1
        const maxDelay = 30 * 1000
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), maxDelay)
        
        // Start polling as fallback after multiple failed attempts
        if (reconnectAttempts >= POLL_AFTER_ATTEMPTS) {
            startPolling()
        }
        
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
            connectWebSocket()
        }, delay)
    }

    // start websocket
    connectWebSocket()

    // Resize handling: keep chart width in sync with its container
    let resizeObserver = null
    const safeResize = () => {
        try {
            const w = Math.max(0, Math.floor(containerEl.clientWidth))
            const h = Math.max(0, Math.floor(containerEl.clientHeight || height))
            if (typeof chart.resize === 'function') {
                chart.resize(w, h)
            } else {
                chart.applyOptions({ width: w, height: h })
            }
        } catch (e) {
            // ignore resize errors
        }
    }

    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            safeResize()
        })
        try { resizeObserver.observe(containerEl) } catch (e) {}
    } else {
        // fallback to window resize
        window.addEventListener('resize', safeResize)
    }

// Convert a visible time item returned by the chart into a unix seconds timestamp
function toTimestampSeconds(t) {
    if (t === null || t === undefined) return null;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') return Math.floor(new Date(t).getTime() / 1000);
    // object form: { rd } timestamp seconds or business day object { year, month, day }
    if (typeof t === 'object') {
        if ('rd' in t && typeof t.rd === 'number') return t.rd;
        if ('time' in t && typeof t.time === 'number') return t.time;
        if ('year' in t && 'month' in t && 'day' in t) return Math.floor(Date.UTC(t.year, t.month - 1, t.day) / 1000);
    }
    return null;
}

// Load older candles (prepend) using Binance REST API with endTime
    async function loadOlderCandles() {
    if (isLoadingOlder || noMoreHistorical || !candles.length) return;
    isLoadingOlder = true;
    try {
        const earliest = candles[0].time; // seconds
        // ask Binance for PAGE_LIMIT candles ending one ms before earliest
        const endTimeMs = earliest * 1000 - 1;
        // Use the canonical upper-case symbol for REST calls (Binance accepts
        // upper or lower but keeping it consistent avoids confusion)
        const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=${PAGE_LIMIT}&endTime=${endTimeMs}`;
        const r = await fetch(url);
        const data = await r.json();
        if (!Array.isArray(data) || data.length === 0) {
            noMoreHistorical = true;
            return;
        }
        const newPoints = data.map(klineArrayToPoint);
        // Binance returns results in chronological order (older -> newer up to endTime)
        // Only keep those strictly older than our current earliest to avoid overlap
        const filtered = newPoints.filter(p => p.time < earliest);
        if (filtered.length === 0) {
            noMoreHistorical = true;
            return;
        }
        candles = filtered.concat(candles);
        candleSeries.setData(candles);
        
        // Update area series with new data
        if (areaSeries) {
            const lineData = candles.map(dp => ({ 
                time: dp.time, 
                value: (dp.close + dp.open) / 2 
            }))
            areaSeries.setData(lineData)
        }
        
        // Update moving average with new data
        if (maSeries) {
            const maData = calculateMovingAverageSeriesData(candles, MA_LENGTH)
            maSeries.setData(maData)
        }
    } catch (e) {
        console.error('failed loading older klines', e);
    } finally {
        isLoadingOlder = false;
    }
}

    const unsub = chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (!range || noMoreHistorical) return
        const fromTs = toTimestampSeconds(range.from)
        if (fromTs === null) return
        const MARGIN_SECONDS = 60
        if (candles.length && fromTs <= candles[0].time + MARGIN_SECONDS) {
            loadOlderCandles()
        }
    })

    // expose a destroy/cleanup function
    function destroy() {
        destroyed = true
        try {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }
        } catch (_) {}
        try {
            stopPolling()
        } catch (_) {}
        try {
            if (connectTimer) {
                clearTimeout(connectTimer)
                connectTimer = null
            }
        } catch (_) {}
        try {
            // Close WebSocket in any state except CLOSED, silently handle all cases
            if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== 3) {
                ws.close(1000, 'Component unmounting')
            }
        } catch (e) {
            // Silently handle - this is expected during React StrictMode cleanup
        }
        try {
            if (typeof unsub === 'function') unsub()
        } catch (_) {}
        try {
            if (resizeObserver) {
                try { resizeObserver.disconnect() } catch (_) {}
                resizeObserver = null
            } else {
                try { window.removeEventListener('resize', safeResize) } catch (_) {}
            }
        } catch (_) {}
        try {
            chart.remove()
        } catch (_) {}
    }

    // start initial load
    loadInitial()

    return {
        destroy,
        chart,
        candleSeries,
    }

}

// Keep backward-compatible export name
export { initBinanceCandleChart as initCandleChart }

// This is a function that displays price of BTC.
// let lastprice = null;

// ws.onmessage = function(event) {
//     let cryptoData = JSON.parse(event.data);
//     let price = parseFloat(cryptoData.p).toFixed(4);
//     //changing the inner text of the h1 element to the received price.
//     cryptoPrice.innerText = "$" + price;
//     //Displaying Data in Console.
//     console.log(cryptoData.p);
//     cryptoPrice.style.color = !lastprice || lastprice === price ? 'black' : price > lastprice ? "green" : "red";
//     lastprice = price;
// }