
<h1 align="center">📈 Random Market Simulator</h1>

<p align="center">
  <strong>A real-time, browser-based market simulation engine with candlestick charting.</strong><br/>
  Fully random. Zero dependencies.
</p>

---

## Features

| Feature | Description |
|---|---|
| 🕯️ **Candlestick Chart** | OHLCV candlesticks |
| 🎲 **Random Walk Engine** | Geometric Brownian Motion with intra-candle tick simulation for realistic price action |
| ▶️ **Instant Generation** | Generate hundreds of candles in one click |
| 🔴 **Live Streaming** | Watch candles appear in real-time with auto-scroll |
| 🎛️ **Tunable Parameters** | Adjust volatility, drift (trend bias), speed, and starting price on the fly |
| 📊 **Technical Overlays** | SMA(20), EMA(50), and volume histogram |
| 📈 **Stats Bar** | Live Open, High, Low, Close, Volume, and % Change display |
| 📱 **Responsive** | Works on desktop and tablet viewports |

---

## Preview

<img width="2548" height="1487" alt="image" src="https://github.com/user-attachments/assets/e2c24436-b6bb-40c1-bf24-53303b4b1ad5" />

---

## Start

**No build step required** just open `index.html` in your browser or serve it locally:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/random-market-sim.git
cd random-market-sim

# Serve locally (pick any method)
npx http-server . -p 8080
# or
python -m http.server 8080
```

Then open **http://localhost:8080** and start simulating!

---

## 🎮 How to Use

1. **Set parameters** in the sidebar: initial price, volatility, drift, speed
2. Click **Generate** to instantly create some random candles
3. Click **Live Stream** to watch candles generate in real-time
4. **Hover** over the chart to see OHLCV stats update in the header
5. Adjust **Volatility** and **Drift** sliders during live streaming to see instant changes
6. Click **Reset** to start fresh

---

## 🧠 How It Works

The price engine uses **Geometric Brownian Motion (GBM)**, the same mathematical model used in options pricing (Black-Scholes):

```
dS = μ·S·dt + σ·S·dW
```

Each candle simulates **8 intra-candle ticks** to produce realistic wicks and body proportions. Volume is correlated with bar size (larger moves produce higher volume), just like in real markets.

### Architecture

```
index.html          → Layout & structure
style.css           → Design system (CSS custom properties, dark theme)
engine.js           → MarketEngine class (GBM, SMA, EMA calculations)
app.js              → UI controller (chart setup, event wiring, state)
```

---

## ⚙️ Parameters

| Parameter | Range | Default | Description |
|---|---|---|---|
| **Initial Price** | 1 – 100,000 | 100 | Starting price for the simulation |
| **Volatility** | 0.1% – 10% | 2% | Standard deviation of returns per candle (σ) |
| **Drift** | -0.5% – +0.5% | 0% | Directional bias per candle (μ). Positive = bull trend |
| **Speed** | 50ms – 2000ms | 500ms | Interval between candles in live stream mode |
| **Pre-generate** | 10 – 5,000 | 200 | Number of candles to generate in batch mode |


You can see it live: [click here](https://www.omegatradinghub.com/simulator)


## 📄 License

Do whatever you want with it.

---

<p align="center">
  <sub>Built for fun, education, and the love of charts. Not financial advice. Obviously. 😄</sub>
</p>
