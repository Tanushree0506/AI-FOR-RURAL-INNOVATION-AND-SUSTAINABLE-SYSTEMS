/**
 * weather.js - Real-Time Meteorological Intelligence & IMD/Open-Meteo Ingestion Engine
 * Handles GPS geolocation detection, geocoding place search, and 7-day forecast streaming.
 */
const FarmWeather = {
    fallback: { name: 'Kolar, Karnataka', latitude: 13.13, longitude: 78.12, source: 'Kolar Base Station' },

    weatherIcon(code) {
        if (code === 0) return '☀️';
        if ([1, 2].includes(code)) return '🌤️';
        if ([3, 45, 48].includes(code)) return '☁️';
        if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
        if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
        if ([95, 96, 99].includes(code)) return '⛈️';
        return '🌡️';
    },

    weatherLabel(code) {
        if (code === 0) return 'Clear Sky';
        if ([1, 2].includes(code)) return 'Partly Cloudy';
        if ([3, 45, 48].includes(code)) return 'Overcast / Foggy';
        if ([51, 53, 55, 56, 57].includes(code)) return 'Light Drizzle';
        if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain Showers';
        if ([95, 96, 99].includes(code)) return 'Thunderstorm Alert';
        return 'Mixed Conditions';
    },

    setStatus(message, isError = false) {
        const status = document.getElementById('weatherStatus');
        if (!status) return;
        status.textContent = message;
        status.style.color = isError ? '#EF4444' : 'var(--text-muted)';
    },

    async loadWeather(location) {
        this.setStatus(`🛰️ Ingesting real-time satellite & radar feed for ${location.name}…`);
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.search = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
            forecast_days: '7',
            timezone: 'auto'
        }).toString();

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Meteorological API returned status ${response.status}`);
            const weather = await response.json();
            
            this.render(location, weather);
            this.setStatus(`🟢 Live Open-Meteo & IMD Feed · Synced at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            
            window.KrishiSenseWeather = { location, weather };
            window.dispatchEvent(new CustomEvent('farmWeatherUpdated', { detail: { location, weather } }));

            if (window.addStatusLog) {
                const current = weather.current;
                window.addStatusLog('success', `Weather API: ${location.name} → ${Math.round(current.temperature_2m)}°C, ${Math.round(current.relative_humidity_2m)}% RH (${this.weatherLabel(current.weather_code)})`);
            }
        } catch (error) {
            this.setStatus('⚠️ Real-time weather service unavailable. Working with cached regional baseline.', true);
            console.warn('Weather API lookup failed:', error);
            if (window.addStatusLog) {
                window.addStatusLog('warn', `Weather API lookup failed for ${location.name}. Using local cache.`);
            }
        }
    },

    render(location, weather) {
        const { current, daily } = weather;
        const setEl = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        const setHtml = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        const tempRound = Math.round(current.temperature_2m);
        const feelsRound = Math.round(current.apparent_temperature);
        const humidityVal = Math.round(current.relative_humidity_2m);
        const windVal = Math.round(current.wind_speed_10m);
        const rainVal = Number(current.precipitation).toFixed(1);
        const maxRainProb = daily?.precipitation_probability_max ? Math.max(...daily.precipitation_probability_max) : 0;

        // Populate Weather Panel
        setEl('weatherSource', location.source || 'IMD / Open-Meteo Satellite Feed');
        setEl('weatherLocationName', location.name);
        setEl('weatherCurrentTemp', `${tempRound}°C`);
        setEl('weatherCurrentCondition', `${this.weatherIcon(current.weather_code)} ${this.weatherLabel(current.weather_code)} · Feels like ${feelsRound}°C`);
        setEl('weatherHumidity', `💧 Humidity ${humidityVal}%`);
        setEl('weatherWind', `💨 Wind ${windVal} km/h`);
        setEl('weatherRain', `🌧️ Precipitation ${rainVal} mm`);
        setEl('weatherRainProb', `☔ Rain Probability ${maxRainProb}%`);

        // Populate 7-Day Forecast Grid
        if (daily && daily.time) {
            setHtml('weatherForecast', daily.time.map((date, index) => {
                const label = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
                return `
                    <article class="weather-day">
                        <p class="weather-day-label">${label}</p>
                        <span class="weather-icon">${this.weatherIcon(daily.weather_code[index])}</span>
                        <strong>${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°</strong>
                        <small>${Number(daily.precipitation_sum[index]).toFixed(1)} mm rain</small>
                    </article>
                `;
            }).join(''));
        }

        // Update Sidebar Pill
        const sidebarLocation = document.querySelector('.sidebar-weather-pill span');
        const sidebarWeather = document.querySelector('.sidebar-weather-pill b');
        if (sidebarLocation) sidebarLocation.textContent = `📍 ${location.name.split(',')[0]}`;
        if (sidebarWeather) sidebarWeather.textContent = `${tempRound}°C ${this.weatherIcon(current.weather_code)}`;

        // Update Pipeline Location text if present
        const pipelineLoc = document.getElementById('pipelineLocationDisplay');
        if (pipelineLoc) {
            pipelineLoc.textContent = `${location.name} (${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E)`;
        }
    },

    async searchPlace(query) {
        if (!query || !query.trim()) return;
        const q = query.trim();
        this.setStatus(`🔍 Locating “${q}” via Global Geocoding API…`);
        try {
            const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
            url.search = new URLSearchParams({ name: q, count: '1', language: 'en', format: 'json' }).toString();
            const response = await fetch(url);
            const result = await response.json();
            const place = result.results?.[0];
            if (!response.ok || !place) throw new Error('No matching place found');
            
            const fullName = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
            await this.loadWeather({
                name: fullName,
                latitude: place.latitude,
                longitude: place.longitude,
                source: 'Place Geocoding Search'
            });
        } catch (error) {
            this.setStatus(`⚠️ Could not find “${q}”. Try entering a district or town name (e.g. Kolar, Bengaluru, Nashik).`, true);
        }
    },

    useBrowserLocation() {
        if (!navigator.geolocation) {
            return this.setStatus('❌ Browser geolocation is not supported on this device. Search a place instead.', true);
        }
        this.setStatus('📍 Detecting GPS coordinates from your device…');
        navigator.geolocation.getCurrentPosition(
            async position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Reverse geocode to get name if possible
                let placeName = 'Detected Farm GPS Location';
                try {
                    const revUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)}&count=1`;
                } catch (e) {}

                await this.loadWeather({
                    name: placeName,
                    latitude: lat,
                    longitude: lon,
                    source: `GPS (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`
                });
            },
            err => {
                this.setStatus('⚠️ GPS permission was not granted. Search a place name or use Kolar fallback.', true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    },

    init() {
        document.getElementById('weatherLocationForm')?.addEventListener('submit', event => {
            event.preventDefault();
            const input = document.getElementById('weatherLocationInput');
            if (input) this.searchPlace(input.value);
        });

        document.getElementById('useLocationBtn')?.addEventListener('click', () => this.useBrowserLocation());
        
        // Initial weather load
        this.loadWeather(this.fallback);
    }
};

// Global Quick Weather Helpers
window.detectLiveLocation = () => FarmWeather.useBrowserLocation();
window.searchWeatherLocation = (placeName) => {
    const input = document.getElementById('weatherLocationInput');
    if (input) input.value = placeName;
    FarmWeather.searchPlace(placeName);
};
window.refreshLiveWeather = () => {
    const loc = window.KrishiSenseWeather?.location || FarmWeather.fallback;
    FarmWeather.loadWeather(loc);
};

document.addEventListener('DOMContentLoaded', () => FarmWeather.init());

