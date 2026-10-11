# NURI: Autonomous Robotic Pre-Consultation Vitals & OPD Triage System

NURI is a medical telemetry system that triages walk-in patients, assigns them a waiting-room seat, and sends an autonomous ESP32 robot to measure their vital signs before the doctor consultation.


<img width="744" height="864" alt="image" src="https://github.com/user-attachments/assets/6b28878d-dc65-415a-a3ba-777e3f0fa8ef" />



## The Problem

In busy outpatient departments, nurses record pulse, SpO2 and temperature by hand for every waiting patient. NURI automates this step so doctors see vitals and triage data as soon as the patient walks in.

## How It Works

### Workflow

1. **Register**: The patient signs in (Auth0) and, on the first visit, enters basic details (age, gender, height, weight).
2. **Triage**: A short symptom survey produces a severity level from Blue (routine) to Red (emergency).
3. **Seat allocation**: The system assigns a waiting seat. High-urgency patients sit on the right wing, near the robot's base, and routine patients on the left. Patients of similar urgency are grouped together to shorten the robot's travel.
4. **Dispatch**: A job is added to the robot queue, ordered by severity first and registration time second.
5. **Measurement**: The robot drives to the seat, measures heart rate, SpO2 and temperature, and uploads the readings.
6. **Review**: The seat is freed, the robot returns to base, and the doctor sees the vitals live on the dashboard.

### Software Side

* **Frontend** (React, Vite, Tailwind, hosted on Vercel): patient dashboard with seat and dispatch status, and a doctor dashboard that updates live.
* **Backend** (Node.js and Express on Render): handles triage scoring, seat assignment, the robot job queue and vitals storage.
* **Database** (PostgreSQL on Supabase): stores patients, readings, seats and robot jobs.
* **Robot communication**: the robot polls `GET /api/robot/next` over HTTPS for the highest-priority job. After measuring, it sends the results with `POST /api/robot/vitals`, which completes the job and releases the seat.

### Hardware Side

* **Controller**: ESP32 DevKit V1 with Wi-Fi, running Arduino firmware.
* **Navigation**: a 5-channel BFD-1000 IR sensor follows a line track on the floor, and an HC-SR04 ultrasonic sensor detects obstacles. An L298N driver runs the DC motors and a servo handles steering.
* **Vitals sensing**: MAX30102 (heart rate and SpO2) and DS18B20 (temperature).
* **Feedback to the patient**: an SSD1306 OLED shows animated status faces, and a MAX98357A amplifier with a speaker plays voice prompts from LittleFS.

## Tech Stack

React 19, Vite, Tailwind CSS, Auth0, Node.js, Express, PostgreSQL (Supabase), ESP32 (Arduino framework)

## Getting Started

1. **Backend**: create a `.env` with `PORT`, `DATABASE_URL` and `ALLOWED_ORIGIN`, then run `node server/setup-db.js` followed by `node server/index.js`.
2. **Frontend**: run `npm install` and then `npm run dev`.
3. **Firmware**: open the `.ino` sketch in Arduino IDE, set your Wi-Fi credentials and `API_BASE_URL`, upload the `.wav` files to LittleFS, and flash the ESP32.

## Disclaimer

NURI is a prototype for demonstration and research. Its readings are not a substitute for clinically validated devices or professional medical judgment.
