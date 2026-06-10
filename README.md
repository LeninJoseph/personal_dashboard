# 🖥️ Lenin's Dashboard — Smart PWA

A **Progressive Web App (PWA)** dashboard designed for Chromebook tablets, optimized for landscape view. Displays a live digital clock, current date, device battery status, and live weather information — all in a premium glassmorphic interface that works fully **offline**.

---

## ✨ Features

### 🕐 Live Clock & Date
- Real-time digital clock updating every second
- Toggle between **12-Hour** (with AM/PM) and **24-Hour** formats
- Toggle **Show / Hide Seconds** independently
- Three date formats: `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY/MM/DD`

### 🌤️ Live Weather
- Fetches weather from the **OpenWeatherMap API**
- Supports **GPS auto-detection** (HTML5 Geolocation) or **Manual City** input
- Toggle between **Celsius (°C)** and **Fahrenheit (°F)**
- Displays: Temperature, Feels Like, Humidity, Wind Speed, and Weather Description
- Inline **SVG weather icons** (sun, clouds, rain, snow, thunder, mist) — offline capable
- Auto-refreshes every **15 minutes**, retries every **1 minute** on failure
- Last fetched weather cached in `localStorage` for offline viewing

### 🔋 Battery Status
- Live battery percentage using the **HTML5 Battery API**
- Visual battery fill indicator with colour-coded levels:
  - 🟢 Green → Above 50%
  - 🟡 Yellow → 20–50%
  - 🔴 Red (pulsing) → Below 20%
  - 🔵 Cyan → Charging
- Estimated time remaining / time to full charge
- Live updates on plug/unplug events

### ⚙️ Settings Panel
A slide-in panel (tap the ⚙️ gear icon) with **7 configurable options**, all applied instantly and persisted across reloads via `localStorage`:

| Setting | Options |
|---|---|
| **Brightness** | Slider 20% → 100% (CSS filter) |
| **Background** | Solid Color (color picker) or Image URL |
| **Clock Text Color** | Color picker |
| **Time Format** | 12-Hour / 24-Hour |
| **Show Seconds** | Show / Hide |
| **Date Format** | MM/DD/YYYY / DD/MM/YYYY / YYYY/MM/DD |
| **Weather Location** | GPS Auto-detect / Manual City input |
| **Temperature Unit** | Celsius / Fahrenheit |
| **API Key** | OpenWeatherMap API Key input |

### 📶 Offline Support
- Full **Service Worker** caching (`sw.js`) with Cache-First strategy
- App shell (HTML, CSS, JS, icons) loads instantly from cache offline
- Weather data cached in `localStorage` for offline display
- Offline status banner shown automatically

### 📱 PWA Installable
- Passes Chromebook PWA installability checks
- Locked to **landscape orientation**
- Opens in **standalone mode** (no browser UI)
- Installable from Chrome browser on ChromeOS, Android, Windows, and macOS

---

## 📁 Project Structure

```
digital_clock/
├── index.html        # App structure, layout, and all CSS styles
├── app.js            # All JavaScript logic (clock, weather, battery, settings)
├── sw.js             # Service Worker (offline caching)
├── manifest.json     # PWA Web App Manifest
├── icon.svg          # App icon (scalable SVG, works as install icon)
└── README.md         # This file
```

---

## 🚀 Running Locally

### Prerequisites
- **Python 3** (comes pre-installed on macOS and most Linux systems)  
  Check: `python3 --version`
- **OR** any static file server (Node.js `http-server`, VS Code Live Server, etc.)

> ⚠️ **Important:** You must serve the app over HTTP (not by opening the file directly). Service Workers and PWA features require an HTTP origin.

---

### Method 1 — Python (Recommended, No Install Needed)

**Step 1:** Open your Terminal and navigate to the project folder:
```bash
cd /path/to/digital_clock
```

**Step 2:** Start a local server:
```bash
python3 -m http.server 8080
```

**Step 3:** Open your browser and go to:
```
http://localhost:8080
```

To stop the server, press `Ctrl + C` in the Terminal.

---

### Method 2 — Node.js `http-server`

**Step 1:** Install `http-server` globally (one-time):
```bash
npm install -g http-server
```

**Step 2:** Run from the project directory:
```bash
http-server . -p 8080
```

**Step 3:** Open your browser:
```
http://localhost:8080
```

---

### Method 3 — VS Code Live Server Extension

1. Open the `digital_clock/` folder in **VS Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.
4. The browser will open automatically at `http://127.0.0.1:5500`.

---

## 🌦️ Setting Up Weather

1. Register for a **free API key** at [openweathermap.org/api](https://openweathermap.org/api).
2. Open the app and tap the **⚙️ gear icon** in the top-right corner.
3. Scroll to **Weather Settings** → paste your API key.
4. Choose **GPS Location** (allow browser location access) or **Manual City** (e.g. `London, GB`).
5. Tap **Apply Changes** — weather will load within seconds.

---

## 💻 Installing as a PWA on ChromeOS

1. Open **Chrome browser** on your Chromebook.
2. Navigate to the app URL (your local server or a hosted URL).
3. Look for the **install icon** (⊕ or monitor icon) in the address bar.
4. Alternatively: tap **Chrome Menu (⋮) → Install app...**
5. The app will appear in your **App Launcher** and can be pinned to the shelf.

> For network access from the Chromebook to your Mac's server, see [Option 2 in the installation guide].

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS3 (Custom Properties, Grid, Flexbox, Backdrop Filter) |
| Logic | Vanilla JavaScript ES6+ (No frameworks) |
| Fonts | Google Fonts (Montserrat, Share Tech Mono) |
| Weather API | OpenWeatherMap Current Weather API |
| Offline | Service Worker (Cache-First strategy) |
| Storage | HTML5 `localStorage` |
| Battery | HTML5 Battery Status API |
| Location | HTML5 Geolocation API |
| PWA | Web App Manifest + Service Worker |

---

## 🛠️ Browser Compatibility

| Browser | Support |
|---|---|
| Chrome (Desktop & Android) | ✅ Full |
| Chrome on ChromeOS | ✅ Full + Installable |
| Edge | ✅ Full |
| Firefox | ⚠️ Partial (Battery API not supported) |
| Safari / iOS | ⚠️ Partial (Limited PWA support) |

---

## 📝 License

This project is open for personal and educational use.
