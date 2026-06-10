// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// ==========================================
// Default State and Constants
// ==========================================
const DEFAULTS = {
  brightness: 100,
  bgSource: 'color', // 'color' or 'image'
  bgColor: '#0a0f1d',
  bgImageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1920&q=80',
  clockColor: '#00f2fe',
  timeFormat: '12h', // '12h' or '24h'
  dateFormat: 'MM/DD/YYYY', // 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'
  weatherLocMode: 'gps', // 'gps' or 'manual'
  weatherManualCity: '',
  weatherApiKey: '',
  weatherUnit: 'metric', // 'metric' (C) or 'imperial' (F)
  showSeconds: true,
  showWeather: true,
  showBattery: true
};

// Global config object loaded from localStorage
let config = {};

// ==========================================
// Weather SVG Icons Renderer (Fully Offline)
// ==========================================
function getWeatherIconSVG(iconCode, description) {
  const isNight = iconCode ? iconCode.includes('n') : false;
  const mainCode = iconCode ? iconCode.substring(0, 2) : '01';

  // Base structures for clouds, suns, etc.
  const svgDefs = `
    <defs>
      <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffb930" />
        <stop offset="100%" stop-color="#ff5500" />
      </linearGradient>
      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
      <linearGradient id="rainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe" />
        <stop offset="100%" stop-color="#4facfe" />
      </linearGradient>
      <linearGradient id="snowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e0f2fe" />
        <stop offset="100%" stop-color="#bae6fd" />
      </linearGradient>
      <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
      <filter id="svgGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  `;

  // Sun Path
  const sunPath = `<circle cx="50" cy="50" r="18" fill="url(#sunGrad)" filter="url(#svgGlow)" />
    <g stroke="url(#sunGrad)" stroke-width="3.5" stroke-linecap="round" filter="url(#svgGlow)">
      <line x1="50" y1="12" x2="50" y2="20" /><line x1="50" y1="80" x2="50" y2="88" />
      <line x1="12" y1="50" x2="20" y2="50" /><line x1="80" y1="50" x2="88" y2="50" />
      <line x1="23" y1="23" x2="29" y2="29" /><line x1="71" y1="71" x2="77" y2="77" />
      <line x1="23" y1="71" x2="29" y2="65" /><line x1="71" y1="23" x2="77" y2="29" />
    </g>`;

  // Moon Path
  const moonPath = `<path d="M60 35 A18 18 0 1 0 65 65 A20 20 0 1 1 60 35 Z" fill="url(#moonGrad)" filter="url(#svgGlow)" />
    <circle cx="28" cy="40" r="1.5" fill="#fff" opacity="0.8" />
    <circle cx="34" cy="55" r="1" fill="#fff" opacity="0.6" />
    <circle cx="48" cy="30" r="2" fill="#fff" opacity="0.9" />`;

  // Cloud Path
  const cloudPath = `<path d="M30 65 h40 a20 20 0 0 0 0 -40 a15 15 0 0 0 -22 -10 a25 25 0 0 0 -18 50 z" fill="url(#cloudGrad)" filter="url(#svgGlow)" opacity="0.95" />`;

  // Back Cloud Path
  const backCloudPath = `<path d="M38 52 h34 a16 16 0 0 0 0 -32 a12 12 0 0 0 -18 -8 a20 20 0 0 0 -16 40 z" fill="url(#cloudGrad)" opacity="0.6" transform="translate(-8, -10) scale(0.95)" />`;

  // Rain Drops
  const rainPath = `<g stroke="url(#rainGrad)" stroke-width="3" stroke-linecap="round" filter="url(#svgGlow)">
    <line x1="38" y1="70" x2="34" y2="82" />
    <line x1="50" y1="72" x2="46" y2="84" />
    <line x1="62" y1="70" x2="58" y2="82" />
  </g>`;

  // Thunder Lightning Bolt
  const lightningPath = `<polygon points="52,65 42,80 50,80 44,95 60,76 50,76" fill="#facc15" filter="url(#svgGlow)" />`;

  // Snow Flakes
  const snowPath = `<g stroke="url(#snowGrad)" stroke-width="2.5" stroke-linecap="round">
    <line x1="38" y1="75" x2="38" y2="81" /><line x1="35" y1="78" x2="41" y2="78" />
    <line x1="50" y1="77" x2="50" y2="83" /><line x1="47" y1="80" x2="53" y2="80" />
    <line x1="62" y1="75" x2="62" y2="81" /><line x1="59" y1="78" x2="65" y2="78" />
  </g>`;

  // Mist lines
  const mistPath = `<g stroke="url(#cloudGrad)" stroke-width="4" stroke-linecap="round" opacity="0.8" filter="url(#svgGlow)">
    <line x1="25" y1="40" x2="75" y2="40" />
    <line x1="35" y1="50" x2="65" y2="50" />
    <line x1="28" y1="60" x2="72" y2="60" />
  </g>`;

  let content = '';

  switch (mainCode) {
    case '01': // Clear Sky
      content = isNight ? moonPath : sunPath;
      break;
    case '02': // Few Clouds
      content = (isNight ? moonPath : sunPath) + `<g transform="translate(10, 10) scale(0.8)">${cloudPath}</g>`;
      break;
    case '03': // Scattered Clouds
      content = cloudPath;
      break;
    case '04': // Broken Clouds / Overcast
      content = backCloudPath + cloudPath;
      break;
    case '09': // Shower Rain
      content = cloudPath + rainPath;
      break;
    case '10': // Rain
      content = (isNight ? moonPath : sunPath) + `<g transform="translate(5, 5) scale(0.9)">${cloudPath}</g>` + rainPath;
      break;
    case '11': // Thunderstorm
      content = cloudPath + lightningPath;
      break;
    case '13': // Snow
      content = cloudPath + snowPath;
      break;
    case '50': // Mist
      content = mistPath;
      break;
    default:
      content = sunPath;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="${description}">${svgDefs}${content}</svg>`;
}

// Helper: Hex color to RGB string (for glow drop-shadow variable)
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
    '0, 242, 254'; // Default cyan
}

// Helper: Pads numbers to two digits
function padZero(num) {
  return String(num).padStart(2, '0');
}

// ==========================================
// Settings Management
// ==========================================
function loadSettings() {
  const stored = localStorage.getItem('dashboard_pwa_settings');
  if (stored) {
    try {
      config = { ...DEFAULTS, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Error loading localStorage settings, using defaults.', e);
      config = { ...DEFAULTS };
    }
  } else {
    config = { ...DEFAULTS };
  }
}

function saveSettings() {
  localStorage.setItem('dashboard_pwa_settings', JSON.stringify(config));
}

// Apply settings directly to the DOM and CSS Custom Properties
function applySettings() {
  const root = document.documentElement;

  // 1. Brightness
  root.style.setProperty('--app-brightness', config.brightness / 100);
  document.getElementById('brightness-slider').value = config.brightness;
  document.getElementById('brightness-val').textContent = `${config.brightness}%`;

  // 2. Background styling
  if (config.bgSource === 'color') {
    root.style.setProperty('--bg-image', 'none');
    root.style.setProperty('--bg-color', config.bgColor);
  } else {
    root.style.setProperty('--bg-color', '#0a0f1d'); // Fallback color
    root.style.setProperty('--bg-image', `url('${config.bgImageUrl}')`);
  }

  // Sync background UI state in panel
  document.getElementById('bg-color-picker').value = config.bgColor;
  document.getElementById('bg-image-url').value = config.bgImageUrl;

  syncSegmentedControls('bg-source-toggle', config.bgSource);
  toggleSubPanel('bg-source-toggle', config.bgSource);

  // 3. Typography Clock Color
  root.style.setProperty('--clock-text-color', config.clockColor);
  root.style.setProperty('--clock-color-rgb', hexToRgb(config.clockColor));
  document.getElementById('clock-color-picker').value = config.clockColor;

  // 4. Regional Formats (Time/Date)
  syncSegmentedControls('time-format-toggle', config.timeFormat);
  syncSegmentedControls('show-seconds-toggle', config.showSeconds ? 'true' : 'false');
  syncSegmentedControls('show-weather-toggle', config.showWeather ? 'true' : 'false');
  syncSegmentedControls('show-battery-toggle', config.showBattery ? 'true' : 'false');
  document.getElementById('date-format-select').value = config.dateFormat;

  // 5. Weather Config
  document.getElementById('weather-key-input').value = config.weatherApiKey;
  syncSegmentedControls('weather-loc-toggle', config.weatherLocMode);
  toggleSubPanel('weather-loc-toggle', config.weatherLocMode);
  document.getElementById('weather-city-input').value = config.weatherManualCity;
  syncSegmentedControls('weather-unit-toggle', config.weatherUnit);

  // 6. Show / Hide weather card
  const weatherCard = document.querySelector('.weather-widget');
  if (weatherCard) {
    if (config.showWeather) {
      weatherCard.style.display = '';
      weatherCard.style.opacity = '1';
      weatherCard.style.transform = 'scaleY(1)';
    } else {
      weatherCard.style.opacity = '0';
      weatherCard.style.transform = 'scaleY(0)';
      // Collapse after animation finishes
      setTimeout(() => {
        if (!config.showWeather) weatherCard.style.display = 'none';
      }, 350);
      // Cancel any pending weather refresh
      if (weatherTimeout) {
        clearTimeout(weatherTimeout);
        weatherTimeout = null;
      }
    }
  }

  // 7. Show / Hide battery card
  const batteryCard = document.querySelector('.battery-widget');
  if (batteryCard) {
    if (config.showBattery) {
      batteryCard.style.display = '';
      batteryCard.style.opacity = '1';
      batteryCard.style.transform = 'scaleY(1)';
    } else {
      batteryCard.style.opacity = '0';
      batteryCard.style.transform = 'scaleY(0)';
      setTimeout(() => {
        if (!config.showBattery) batteryCard.style.display = 'none';
      }, 350);
    }
  }

  // 8. Update clock layout based on visible widgets
  updateClockLayout();

  // Run initial updates for clock and weather immediately
  updateClock();
  if (config.showWeather) {
    fetchWeather();
  }
}

// Resize clock card based on how many right-column widgets are visible
function updateClockLayout() {
  const clockCard = document.querySelector('.clock-widget');
  const widgetsSection = document.querySelector('.widgets-section');
  if (!clockCard || !widgetsSection) return;

  const bothHidden = !config.showWeather && !config.showBattery;
  const oneHidden  = (!config.showWeather) !== (!config.showBattery); // XOR

  // Reset state classes
  clockCard.classList.remove('clock-md', 'clock-xl');

  if (bothHidden) {
    // Full-width hero clock
    clockCard.classList.add('clock-xl');
    // Delay hiding the section until battery/weather animations finish
    setTimeout(() => { widgetsSection.style.display = 'none'; }, 360);
  } else {
    // Ensure section is visible
    widgetsSection.style.display = '';
    if (oneHidden) {
      // One widget still showing — medium clock
      clockCard.classList.add('clock-md');
    }
    // Both visible — normal (no extra class needed)
  }
}

// Helpers for Toggle button rendering (Segmented Controls)
function syncSegmentedControls(containerId, activeValue) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = container.querySelectorAll('.segmented-btn');
  buttons.forEach(btn => {
    // Check if matching dataset attribute
    const val = btn.dataset.source || btn.dataset.format || btn.dataset.mode || btn.dataset.unit || btn.dataset.show;
    if (val === activeValue) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function toggleSubPanel(controlId, activeValue) {
  if (controlId === 'bg-source-toggle') {
    const colorPanel = document.getElementById('bg-color-panel');
    const imagePanel = document.getElementById('bg-image-panel');
    if (activeValue === 'color') {
      colorPanel.classList.add('active');
      imagePanel.classList.remove('active');
    } else {
      colorPanel.classList.remove('active');
      imagePanel.classList.add('active');
    }
  } else if (controlId === 'weather-loc-toggle') {
    const manualPanel = document.getElementById('weather-manual-panel');
    if (activeValue === 'manual') {
      manualPanel.classList.add('active');
    } else {
      manualPanel.classList.remove('active');
    }
  }
}

// ==========================================
// Clock and Date Logic
// ==========================================
function updateClock() {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const clockEl = document.getElementById('clock-display');
  const ampmEl = document.getElementById('clock-ampm');
  const dateEl = document.getElementById('date-display');

  // Format Time
  const secondsStr = config.showSeconds ? `:${padZero(seconds)}` : '';
  if (config.timeFormat === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    clockEl.innerHTML = `${padZero(hours)}:${padZero(minutes)}${secondsStr}<span class="clock-ampm" id="clock-ampm">${ampm}</span>`;
  } else {
    clockEl.textContent = `${padZero(hours)}:${padZero(minutes)}${secondsStr}`;
  }

  // Format Date
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[date.getDay()];
  const mm = padZero(date.getMonth() + 1);
  const dd = padZero(date.getDate());
  const yyyy = date.getFullYear();

  let dateStr = '';
  switch (config.dateFormat) {
    case 'DD/MM/YYYY':
      dateStr = `${dayName}, ${dd}/${mm}/${yyyy}`;
      break;
    case 'YYYY/MM/DD':
      dateStr = `${dayName}, ${yyyy}/${mm}/${dd}`;
      break;
    case 'MM/DD/YYYY':
    default:
      dateStr = `${dayName}, ${mm}/${dd}/${yyyy}`;
      break;
  }

  dateEl.textContent = dateStr;
}

// ==========================================
// Battery Status Logic
// ==========================================
function initBattery() {
  const fillEl = document.getElementById('battery-fill');
  const textEl = document.getElementById('battery-status');
  const bigPctEl = document.getElementById('battery-pct-big');
  const timeEl = document.getElementById('battery-time-lbl');

  // Header Battery nodes
  const headValEl = document.getElementById('header-battery-val');
  const headIconLevel = document.getElementById('header-battery-level-path');

  function updateBatteryUI(battery) {
    const level = battery.level;
    const levelPct = Math.round(level * 100);
    const isCharging = battery.charging;

    // Update Numerical Percentages
    bigPctEl.textContent = `${levelPct}%`;
    headValEl.textContent = `${levelPct}%`;

    // Set Fill height
    fillEl.style.height = `${levelPct}%`;

    // Header Battery SVG path vertical height simulation
    // Height starts from 20 (bottom) down to 7 (top) inside vertical rect of 24px icon.
    const pathHeightVal = 7 + (13 * (1 - level));
    headIconLevel.setAttribute('d', `M17 5H16V3H8V5H7C5.9 5 5 5.9 5 7V${Math.round(pathHeightVal)}H19V7C19 5.9 18.1 5 17 5Z`);

    // Reset indicator classes
    fillEl.className = 'battery-level-fill';

    // Status text & colors
    if (isCharging) {
      fillEl.classList.add('charging');
      textEl.textContent = 'Charging';
      textEl.style.color = '#00f2fe';

      if (battery.chargingTime !== Infinity && battery.chargingTime > 0) {
        const hrs = Math.floor(battery.chargingTime / 3600);
        const mins = Math.round((battery.chargingTime % 3600) / 60);
        timeEl.textContent = `${hrs > 0 ? hrs + 'h ' : ''}${mins}m to full capacity`;
      } else {
        timeEl.textContent = 'Connected to power source';
      }
    } else {
      textEl.textContent = 'Battery Mode';
      textEl.style.color = '';

      // Color warning threshold logic
      if (levelPct > 50) {
        // Safe green
      } else if (levelPct <= 50 && levelPct > 20) {
        fillEl.classList.add('warning');
      } else {
        fillEl.classList.add('danger');
      }

      if (battery.dischargingTime !== Infinity && battery.dischargingTime > 0) {
        const hrs = Math.floor(battery.dischargingTime / 3600);
        const mins = Math.round((battery.dischargingTime % 3600) / 60);
        timeEl.textContent = `Approx. ${hrs > 0 ? hrs + 'h ' : ''}${mins}m remaining`;
      } else {
        timeEl.textContent = 'Discharging';
      }
    }
  }

  // Check support for Battery API
  if ('getBattery' in navigator) {
    navigator.getBattery().then((battery) => {
      updateBatteryUI(battery);

      // Wire up updates
      battery.addEventListener('chargingchange', () => updateBatteryUI(battery));
      battery.addEventListener('levelchange', () => updateBatteryUI(battery));
      battery.addEventListener('chargingtimechange', () => updateBatteryUI(battery));
      battery.addEventListener('dischargingtimechange', () => updateBatteryUI(battery));
    });
  } else {
    // Graceful fallback for non-compatible browsers
    textEl.textContent = 'AC Powered';
    bigPctEl.textContent = '100%';
    headValEl.textContent = '100%';
    fillEl.style.height = '100%';
    fillEl.classList.add('charging');
    timeEl.textContent = 'Battery API unsupported on this browser';
  }
}

// ==========================================
// Weather Fetcher Logic (OpenWeatherMap API)
// ==========================================
let weatherTimeout = null;

async function fetchWeather() {
  const cityEl = document.getElementById('weather-city');
  const countryEl = document.getElementById('weather-country');
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const unitLbl = document.getElementById('weather-unit-lbl');
  const iconEl = document.getElementById('weather-icon');
  const syncEl = document.getElementById('weather-sync');

  const feelsEl = document.getElementById('weather-feels');
  const humEl = document.getElementById('weather-humidity');
  const windEl = document.getElementById('weather-wind');

  // Clear any existing sync timers
  if (weatherTimeout) clearTimeout(weatherTimeout);

  // Set unit label
  const isMetric = config.weatherUnit === 'metric';
  unitLbl.textContent = isMetric ? '°C' : '°F';

  // 1. Key validation
  if (!config.weatherApiKey || config.weatherApiKey.trim() === '') {
    cityEl.textContent = 'Weather Setup';
    countryEl.textContent = 'Missing API Key';
    descEl.textContent = 'Paste OpenWeatherMap key in Settings to sync weather.';
    syncEl.textContent = 'Needs API Key';
    syncEl.style.background = 'rgba(239, 68, 68, 0.2)';
    syncEl.style.color = '#ef4444';
    return;
  }

  // 2. Offline check
  if (!navigator.onLine) {
    syncEl.textContent = 'Offline Mode';
    syncEl.style.background = 'rgba(245, 158, 11, 0.2)';
    syncEl.style.color = '#f59e0b';

    // Attempt cache read
    const cachedWeather = localStorage.getItem('last_cached_weather');
    if (cachedWeather) {
      try {
        displayWeatherData(JSON.parse(cachedWeather));
      } catch (e) {
        console.error('Error loading offline weather cache', e);
      }
    }
    return;
  }

  syncEl.textContent = 'Syncing...';
  syncEl.style.background = '';
  syncEl.style.color = '';

  let apiQuery = '';

  // Mode 1: GPS Location Query
  if (config.weatherLocMode === 'gps') {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          apiQuery = `lat=${lat}&lon=${lon}`;
          executeWeatherQuery(apiQuery);
        },
        (error) => {
          console.warn('Geolocation failed/denied, falling back to manual city', error);
          // Auto fallback to manual city if available, otherwise notify
          if (config.weatherManualCity) {
            apiQuery = `q=${encodeURIComponent(config.weatherManualCity)}`;
            executeWeatherQuery(apiQuery);
          } else {
            cityEl.textContent = 'GPS Blocked';
            countryEl.textContent = 'Geo Error';
            descEl.textContent = 'Allow GPS in browser settings or configure manual city.';
            syncEl.textContent = 'GPS Error';
            syncEl.style.background = 'rgba(239, 68, 68, 0.2)';
            syncEl.style.color = '#ef4444';
          }
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    } else {
      // Fallback if browser doesn't support geolocation
      if (config.weatherManualCity) {
        apiQuery = `q=${encodeURIComponent(config.weatherManualCity)}`;
        executeWeatherQuery(apiQuery);
      } else {
        cityEl.textContent = 'GPS Unsupported';
        descEl.textContent = 'Choose Manual City inside app Settings.';
      }
    }
  } else {
    // Mode 2: Manual City Location Query
    if (config.weatherManualCity && config.weatherManualCity.trim() !== '') {
      apiQuery = `q=${encodeURIComponent(config.weatherManualCity)}`;
      executeWeatherQuery(apiQuery);
    } else {
      cityEl.textContent = 'No City Input';
      countryEl.textContent = 'Set location';
      descEl.textContent = 'Enter a manual city name in configuration sidebar.';
      syncEl.textContent = 'Pending Location';
    }
  }

  // Core OpenWeather API Executor
  async function executeWeatherQuery(queryStr) {
    const url = `https://api.openweathermap.org/data/4.0/onecall/current?lat=${config.latitude}&lon=${config.longitude}&appid=${config.weatherApiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();

      // Cache response for offline compatibility
      localStorage.setItem('last_cached_weather', JSON.stringify(data));

      displayWeatherData(data);

      syncEl.textContent = 'Updated';
      syncEl.style.background = 'rgba(16, 185, 129, 0.2)';
      syncEl.style.color = '#10b981';

      // Auto-schedule next weather sync in 15 minutes
      weatherTimeout = setTimeout(fetchWeather, 15 * 60 * 1000);
    } catch (err) {
      console.error('Failed to sync weather:', err);
      descEl.textContent = 'Request failed. Double-check API key or city spelling.';
      syncEl.textContent = 'Failed';
      syncEl.style.background = 'rgba(239, 68, 68, 0.2)';
      syncEl.style.color = '#ef4444';

      // Retry in 1 minute on failure
      weatherTimeout = setTimeout(fetchWeather, 60 * 1000);
    }
  }

  // Render weather values into elements
  function displayWeatherData(data) {
    if (!data || !data.main) return;

    cityEl.textContent = data.name;
    countryEl.textContent = data.sys.country;
    tempEl.textContent = Math.round(data.main.temp);

    const weatherCond = data.weather[0];
    descEl.textContent = weatherCond.description;

    // Detailed metrics
    feelsEl.textContent = `${Math.round(data.main.feels_like)}°`;
    humEl.textContent = `${data.main.humidity}%`;

    const windSpeedUnit = isMetric ? 'm/s' : 'mph';
    windEl.textContent = `${data.wind.speed} ${windSpeedUnit}`;

    // Inline SVG Icon rendering matching the current icon code
    iconEl.innerHTML = getWeatherIconSVG(weatherCond.icon, weatherCond.description);
  }
}

// ==========================================
// UI Toggles & Panel Controls
// ==========================================
function initSettingsUI() {
  const sidebar = document.getElementById('settings-sidebar');
  const scrim = document.getElementById('settings-scrim');
  const openBtn = document.getElementById('settings-open');
  const closeBtn = document.getElementById('settings-close');
  const saveBtn = document.getElementById('save-settings-btn');

  // Toggle Settings Panel Drawer
  function openPanel() {
    sidebar.classList.add('open');
    scrim.classList.add('active');
  }

  function closePanel() {
    sidebar.classList.remove('open');
    scrim.classList.remove('active');
  }

  openBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);

  // Real-time Brightness change tracker
  const brightnessInput = document.getElementById('brightness-slider');
  const brightnessValEl = document.getElementById('brightness-val');
  brightnessInput.addEventListener('input', (e) => {
    const val = e.target.value;
    brightnessValEl.textContent = `${val}%`;
    document.documentElement.style.setProperty('--app-brightness', val / 100);
  });

  // Segmented Control Event Handler Setup
  setupSegmentedClick('bg-source-toggle', (val) => {
    toggleSubPanel('bg-source-toggle', val);
  });

  setupSegmentedClick('weather-loc-toggle', (val) => {
    toggleSubPanel('weather-loc-toggle', val);
  });

  setupSegmentedClick('weather-unit-toggle');
  setupSegmentedClick('time-format-toggle');
  setupSegmentedClick('show-seconds-toggle');
  setupSegmentedClick('show-weather-toggle');
  setupSegmentedClick('show-battery-toggle');

  function setupSegmentedClick(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.segmented-btn');
      if (!btn) return;

      const siblings = container.querySelectorAll('.segmented-btn');
      siblings.forEach(s => s.classList.remove('active'));
      btn.classList.add('active');

      const value = btn.dataset.source || btn.dataset.format || btn.dataset.mode || btn.dataset.unit || btn.dataset.show;
      if (callback) callback(value);
    });
  }

  // Save and Apply Configuration handler
  saveBtn.addEventListener('click', () => {
    // Fetch values from settings panel input boxes
    config.brightness = parseInt(brightnessInput.value);

    const bgSourceBtn = document.querySelector('#bg-source-toggle .segmented-btn.active');
    config.bgSource = bgSourceBtn ? bgSourceBtn.dataset.source : DEFAULTS.bgSource;
    config.bgColor = document.getElementById('bg-color-picker').value;
    config.bgImageUrl = document.getElementById('bg-image-url').value;

    config.clockColor = document.getElementById('clock-color-picker').value;

    const timeFormatBtn = document.querySelector('#time-format-toggle .segmented-btn.active');
    config.timeFormat = timeFormatBtn ? timeFormatBtn.dataset.format : DEFAULTS.timeFormat;

    const showSecondsBtn = document.querySelector('#show-seconds-toggle .segmented-btn.active');
    config.showSeconds = showSecondsBtn ? showSecondsBtn.dataset.show === 'true' : DEFAULTS.showSeconds;

    config.dateFormat = document.getElementById('date-format-select').value;

    const showWeatherBtn = document.querySelector('#show-weather-toggle .segmented-btn.active');
    config.showWeather = showWeatherBtn ? showWeatherBtn.dataset.show === 'true' : DEFAULTS.showWeather;

    const showBatteryBtn = document.querySelector('#show-battery-toggle .segmented-btn.active');
    config.showBattery = showBatteryBtn ? showBatteryBtn.dataset.show === 'true' : DEFAULTS.showBattery;

    config.weatherApiKey = document.getElementById('weather-key-input').value;

    const weatherLocBtn = document.querySelector('#weather-loc-toggle .segmented-btn.active');
    config.weatherLocMode = weatherLocBtn ? weatherLocBtn.dataset.mode : DEFAULTS.weatherLocMode;
    config.weatherManualCity = document.getElementById('weather-city-input').value;

    const weatherUnitBtn = document.querySelector('#weather-unit-toggle .segmented-btn.active');
    config.weatherUnit = weatherUnitBtn ? weatherUnitBtn.dataset.unit : DEFAULTS.weatherUnit;

    // Save state to storage
    saveSettings();

    // Apply changes instantly
    applySettings();

    // Slide drawer closed
    closePanel();
  });
}

// ==========================================
// Offline Connection Event Banner Toggles
// ==========================================
function initConnectivityChecks() {
  const banner = document.getElementById('offline-banner');

  function updateOnlineStatus() {
    if (navigator.onLine) {
      banner.classList.remove('active');
      // Trigger a weather update to refresh cached layout if back online
      fetchWeather();
    } else {
      banner.classList.add('active');
      // Update weather status immediately with offline details
      fetchWeather();
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initial check on load
  if (!navigator.onLine) {
    banner.classList.add('active');
  }
}

// ==========================================
// Core Entry Initializer
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initSettingsUI();
  applySettings();
  initBattery();
  initConnectivityChecks();

  // Keep clock running continuously
  setInterval(updateClock, 1000);
});
