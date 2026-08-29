/**
 * Vitals Service - Telemetry and Sensor Data Service
 * 
 * Provides an abstraction layer for fetching patient biometric vitals.
 * In a production environment, replace the simulation below with:
 *  - ESP32 / Arduino WebSocket feed (`const ws = new WebSocket('ws://esp32.local:81');`)
 *  - REST API endpoint (`fetch('/api/v1/sensors/latest')`)
 *  - MQTT / WebRTC telemetry stream
 */

/**
 * Simulates or fetches a single OPD pre-consultation vitals reading.
 * @returns {Promise<{heartRate: number, spO2: number, temperature: number, timestamp: string, status: string}>}
 */
export async function fetchVitalsReading() {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Heart Rate: Random integer between 60 and 100 bpm
      const heartRate = Math.floor(Math.random() * (100 - 60 + 1)) + 60;

      // 2. Oxygen SpO2: Random integer between 95 and 100 %
      const spO2 = Math.floor(Math.random() * (100 - 95 + 1)) + 95;

      // 3. Body Temperature: Random float between 36.1 and 37.2 °C (1 decimal)
      const rawTemp = Math.random() * (37.2 - 36.1) + 36.1;
      const temperature = parseFloat(rawTemp.toFixed(1));

      // 4. Timestamp formatting (e.g., '10:45 AM, Just now')
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timestamp = `${timeStr}, Just now`;

      // 5. Status: Normal or Optimal based on readings
      const status = (spO2 >= 98 && heartRate >= 65 && heartRate <= 85) ? 'Optimal' : 'Normal';

      resolve({
        heartRate,
        spO2,
        temperature,
        timestamp,
        status
      });
    }, 2000);
  });
}
