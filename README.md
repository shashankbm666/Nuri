# Nuri

A hospital vitals-monitoring web app for walk-in/OPD patients. Patients place 
a finger on an ESP32-connected sensor (MAX30102 + temperature sensor) to get 
a quick heart rate, SpO2, and temperature reading before their consultation — 
no continuous monitoring, just a fast pre-visit check.

## Features
- **Patient Dashboard** — profile info, one-tap "Start Reading," and current 
  vitals at a glance
- **Doctor Dashboard** — patient list, reading history, and trend charts
- **Two-role auth** — patient self-registration (Auth0) and PIN-gated doctor 
  access
- **ESP32 integration** — one-shot sensor capture posted to the backend on 
  each reading

## Status
🚧 In development — currently building with mock data; ESP32 and Auth0 
integration in progress.

## Tech Stack
React · Node.js/Express (planned) · ESP32 · MAX30102
