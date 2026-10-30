/**
 * sensors.js - Real-Time & Simulated IoT Field Sensor Telemetry (ST-GNN)
 * Manages soil moisture, temperature, humidity, pH, NPK, NDVI, and anomaly alerts.
 */

const SensorTelemetry = {
    state: {
        moisture: 42,
        temperature: 29.4,
        humidity: 65,
        ph: 6.4,
        nitrogen: 88,
        phosphorus: 40,
        potassium: 42,
        ndvi: 0.74,
        dataGap: 8,
        anomalyCount: 0
    },

    step: 0,

    update() {
        this.step += 0.2;
        // Diurnal oscillation
        const diurnal = Math.sin(this.step) * 3.5;
        this.state.temperature = Math.round((29.0 + diurnal + (Math.random() - 0.5) * 0.8) * 10) / 10;
        this.state.humidity = Math.round(Math.max(30, Math.min(95, 66 - diurnal * 1.4 + (Math.random() - 0.5) * 2)));
        
        // Soil moisture slow drift
        const rainChance = Math.random() < 0.05 ? 6 : 0;
        this.state.moisture = Math.round(Math.max(15, Math.min(75, this.state.moisture - 0.1 + rainChance + (Math.random() - 0.5) * 0.8)));
        
        // pH and NDVI
        this.state.ph = Math.round((6.4 + (Math.random() - 0.5) * 0.1) * 10) / 10;
        const ndviStress = this.state.moisture < 25 ? -0.1 : 0;
        this.state.ndvi = Math.round(Math.max(0.1, Math.min(0.95, 0.45 + (this.state.moisture / 100) * 0.4 + ndviStress + (Math.random() - 0.5) * 0.02)) * 100) / 100;
        
        // Data gap & noise
        this.state.dataGap = Math.round(Math.max(2, Math.min(18, 8 + (Math.random() - 0.5) * 3)));

        this.render();
        this.checkAlerts();
    },

    render() {
        const updateElem = (id, val, widthPct) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
            const bar = document.getElementById(id + 'Fill');
            if (bar && widthPct !== undefined) bar.style.width = Math.min(100, Math.max(0, widthPct)) + '%';
        };

        updateElem('sensorMoisture', this.state.moisture + '%', this.state.moisture);
        updateElem('sensorTemp', this.state.temperature + '°C', ((this.state.temperature - 10) / 35) * 100);
        updateElem('sensorHumidity', this.state.humidity + '%', this.state.humidity);
        updateElem('sensorPH', this.state.ph, ((this.state.ph - 4) / 5) * 100);
        updateElem('sensorNDVI', this.state.ndvi, this.state.ndvi * 100);
        updateElem('sensorGap', this.state.dataGap + '%', this.state.dataGap * 4);
        
        // Remote Sensing Layers (ERA5-Land & NASA POWER)
        const soilTemp = Math.round((this.state.temperature - 4.2 + (Math.random() - 0.5) * 0.4) * 10) / 10;
        const solarMJ = Math.round((21.4 + Math.sin(this.step) * 1.5) * 10) / 10;
        updateElem('sensorSoilTemp', soilTemp + '°C', ((soilTemp - 10) / 30) * 100);
        updateElem('sensorSolar', solarMJ + ' MJ', (solarMJ / 30) * 100);
    },

    checkAlerts() {
        if (this.state.moisture < 25 && Math.random() < 0.3) {
            if (window.addStatusLog) {
                window.addStatusLog('warn', `⚠️ Critical Moisture Alert: Field Zone A at ${this.state.moisture}% (Threshold < 28%)`);
            }
        }
        if (this.state.temperature > 36 && Math.random() < 0.2) {
            if (window.addStatusLog) {
                window.addStatusLog('warn', `🌡️ Heat Stress Warning: Ambient temp reached ${this.state.temperature}°C`);
            }
        }
    }
};

window.updateSensors = () => SensorTelemetry.update();

document.addEventListener('DOMContentLoaded', () => {
    SensorTelemetry.update();
    setInterval(() => SensorTelemetry.update(), 3500);
});
