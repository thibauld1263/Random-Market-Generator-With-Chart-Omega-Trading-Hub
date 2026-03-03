/**
 * Random Market Simulator — Main Application
 * Wires up UI controls, TradingView Lightweight Charts, and the MarketEngine.
 */
(function () {
    'use strict';

    // ── DOM refs ──
    const $ = (sel) => document.querySelector(sel);
    const chartEl = $('#chart');
    const overlayEl = $('#chart-overlay');
    const statusBadge = $('#status-badge');

    const inputPrice = $('#initial-price');
    const inputVol = $('#volatility');
    const inputDrift = $('#drift');
    const inputSpeed = $('#speed');
    const inputCount = $('#candle-count');

    const volDisplay = $('#vol-display');
    const driftDisplay = $('#drift-display');
    const speedDisplay = $('#speed-display');

    const toggleSMA = $('#toggle-sma');
    const toggleEMA = $('#toggle-ema');
    const toggleVolume = $('#toggle-volume');

    const btnGenerate = $('#btn-generate');
    const btnStream = $('#btn-stream');
    const btnReset = $('#btn-reset');

    const statOpen = $('#stat-open');
    const statHigh = $('#stat-high');
    const statLow = $('#stat-low');
    const statClose = $('#stat-close');
    const statVolume = $('#stat-volume');
    const statChange = $('#stat-change');

    // ── State ──
    let engine = new MarketEngine();
    let chart, candleSeries, volumeSeries, smaSeries, emaSeries;
    let allCandles = [];
    let streamInterval = null;
    let isStreaming = false;

    // ── Chart Setup ──
    function createChart() {
        if (chart) chart.remove();

        chart = LightweightCharts.createChart(chartEl, {
            layout: {
                background: { type: 'solid', color: '#0a0e17' },
                textColor: '#94a3b8',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12,
            },
            grid: {
                vertLines: { color: 'rgba(30,41,59,.5)' },
                horzLines: { color: 'rgba(30,41,59,.5)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: { color: 'rgba(59,130,246,.4)', width: 1, style: 2 },
                horzLine: { color: 'rgba(59,130,246,.4)', width: 1, style: 2 },
            },
            rightPriceScale: {
                borderColor: '#1e293b',
                scaleMargins: { top: 0.1, bottom: 0.25 },
            },
            timeScale: {
                borderColor: '#1e293b',
                timeVisible: false,
                rightOffset: 5,
            },
            handleScroll: true,
            handleScale: true,
        });

        // Candlestick series
        candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Volume series
        volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });

        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        // SMA line
        smaSeries = chart.addLineSeries({
            color: '#f59e0b',
            lineWidth: 1.5,
            lineStyle: 0,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // EMA line
        emaSeries = chart.addLineSeries({
            color: '#a78bfa',
            lineWidth: 1.5,
            lineStyle: 0,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // Crosshair move → update stats
        chart.subscribeCrosshairMove((param) => {
            if (!param || !param.time) {
                updateStatsFromLast();
                return;
            }
            const candle = param.seriesData.get(candleSeries);
            if (candle) updateStats(candle);
        });

        handleResize();
    }

    // ── Resize handler ──
    function handleResize() {
        const ro = new ResizeObserver(() => {
            chart.applyOptions({
                width: chartEl.clientWidth,
                height: chartEl.clientHeight,
            });
        });
        ro.observe(chartEl);
    }

    // ── Stats display ──
    function updateStats(c) {
        statOpen.textContent = c.open?.toFixed(2) ?? '—';
        statHigh.textContent = c.high?.toFixed(2) ?? '—';
        statLow.textContent = c.low?.toFixed(2) ?? '—';
        statClose.textContent = c.close?.toFixed(2) ?? '—';

        if (c.volume !== undefined) {
            statVolume.textContent = formatVolume(c.volume);
        } else {
            // look up from allCandles
            const match = allCandles.find(x => x.time === c.time);
            statVolume.textContent = match ? formatVolume(match.volume) : '—';
        }

        const pctChange = ((c.close - c.open) / c.open * 100);
        statChange.textContent = (pctChange >= 0 ? '+' : '') + pctChange.toFixed(2) + '%';
        statChange.style.color = pctChange >= 0 ? 'var(--green)' : 'var(--red)';
    }

    function updateStatsFromLast() {
        if (allCandles.length === 0) return;
        updateStats(allCandles[allCandles.length - 1]);
    }

    function formatVolume(v) {
        if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
        if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
        return v.toString();
    }

    // ── Render All Data ──
    function renderAll() {
        candleSeries.setData(allCandles.map(c => ({
            time: c.time, open: c.open, high: c.high, low: c.low, close: c.close
        })));

        volumeSeries.setData(allCandles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)',
        })));

        volumeSeries.applyOptions({
            visible: toggleVolume.checked,
        });

        renderOverlays();
        updateStatsFromLast();
        chart.timeScale().fitContent();
    }

    function renderOverlays() {
        if (toggleSMA.checked && allCandles.length >= 20) {
            smaSeries.setData(MarketEngine.sma(allCandles, 20));
            smaSeries.applyOptions({ visible: true });
        } else {
            smaSeries.applyOptions({ visible: false });
        }

        if (toggleEMA.checked && allCandles.length >= 50) {
            emaSeries.setData(MarketEngine.ema(allCandles, 50));
            emaSeries.applyOptions({ visible: true });
        } else {
            emaSeries.applyOptions({ visible: false });
        }
    }

    // ── Actions ──
    function getParams() {
        return {
            initialPrice: +inputPrice.value,
            volatility: +inputVol.value,
            drift: +inputDrift.value,
        };
    }

    function generate() {
        stopStream();
        const params = getParams();
        engine.reset(params);
        allCandles = engine.generateBatch(+inputCount.value);
        overlayEl.classList.add('hidden');
        statusBadge.textContent = 'GENERATED';
        statusBadge.classList.remove('live');
        renderAll();
    }

    function toggleStream() {
        if (isStreaming) {
            stopStream();
        } else {
            startStream();
        }
    }

    function startStream() {
        if (allCandles.length === 0) {
            // Generate initial batch first
            const params = getParams();
            engine.reset(params);
            allCandles = engine.generateBatch(50);
            overlayEl.classList.add('hidden');
            renderAll();
        }

        isStreaming = true;
        statusBadge.textContent = 'LIVE';
        statusBadge.classList.add('live');
        btnStream.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      Stop
    `;
        btnStream.classList.add('streaming');

        streamInterval = setInterval(() => {
            // Update engine params dynamically
            engine.volatility = +inputVol.value;
            engine.drift = +inputDrift.value;

            const candle = engine.nextCandle();
            allCandles.push(candle);

            candleSeries.update({
                time: candle.time, open: candle.open, high: candle.high,
                low: candle.low, close: candle.close
            });

            volumeSeries.update({
                time: candle.time,
                value: candle.volume,
                color: candle.close >= candle.open ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)',
            });

            renderOverlays();
            updateStats(candle);
        }, +inputSpeed.value);
    }

    function stopStream() {
        if (streamInterval) clearInterval(streamInterval);
        streamInterval = null;
        isStreaming = false;
        statusBadge.textContent = 'PAUSED';
        statusBadge.classList.remove('live');
        btnStream.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      Live Stream
    `;
        btnStream.classList.remove('streaming');
    }

    function resetAll() {
        stopStream();
        engine = new MarketEngine();
        allCandles = [];
        inputPrice.value = 100;
        inputVol.value = 2;
        inputDrift.value = 0;
        inputSpeed.value = 500;
        inputCount.value = 200;
        volDisplay.textContent = '2.0%';
        driftDisplay.textContent = '0.00%';
        speedDisplay.textContent = '500ms';
        statusBadge.textContent = 'IDLE';
        statusBadge.classList.remove('live');
        overlayEl.classList.remove('hidden');
        statOpen.textContent = '—';
        statHigh.textContent = '—';
        statLow.textContent = '—';
        statClose.textContent = '—';
        statVolume.textContent = '—';
        statChange.textContent = '—';
        statChange.style.color = '';
        createChart();
    }

    // ── Slider displays ──
    inputVol.addEventListener('input', () => {
        volDisplay.textContent = (+inputVol.value).toFixed(1) + '%';
    });
    inputDrift.addEventListener('input', () => {
        driftDisplay.textContent = (+inputDrift.value).toFixed(2) + '%';
    });
    inputSpeed.addEventListener('input', () => {
        speedDisplay.textContent = inputSpeed.value + 'ms';
        // Update interval live if streaming
        if (isStreaming) {
            stopStream();
            startStream();
        }
    });

    // ── Toggle listeners ──
    toggleSMA.addEventListener('change', () => renderOverlays());
    toggleEMA.addEventListener('change', () => renderOverlays());
    toggleVolume.addEventListener('change', () => {
        volumeSeries.applyOptions({ visible: toggleVolume.checked });
    });

    // ── Button listeners ──
    btnGenerate.addEventListener('click', generate);
    btnStream.addEventListener('click', toggleStream);
    btnReset.addEventListener('click', resetAll);

    // ── Init ──
    createChart();
})();
