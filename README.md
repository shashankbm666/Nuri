# NURI: Autonomous Robotic Pre-Consultation Vitals & OPD Triage System

An end-to-end medical telemetric system that combines patient self-service onboarding, clinical symptom triage, dynamic waiting-room seat allocation, and an autonomous ESP32 robotic assistant to measure and stream vital signs directly to medical staff prior to doctor consultation.

---

## 1. Overview

Outpatient departments (OPD) often face bottlenecks during peak hours. Traditional triage requires nurses to manually record vital signs (pulse, SpO2, temperature) for every patient in the waiting room. 

NURI automates this process:
1. Walk-in patients register and complete a structured pre-consultation symptom survey.
2. The system computes a clinical severity score and automatically assigns an optimized waiting-area seat.
3. An autonomous mobile robot navigates along a path to the patient's seat, conducts non-invasive telemetry scans, and streams readings to the hospital database.
4. The attending physician reviews real-time vitals and triage history on the Doctor Dashboard before the patient enters the consultation room.

<!-- INSERT HARDWARE / ROBOT MODEL PICTURE HERE -->
![NURI Robot and System Architecture](assets/nuri-system-overview.png)
<!-- INSERT HARDWARE / ROBOT MODEL PICTURE HERE -->

---

## 2. System Architecture & Workflow

### Phase 1: Patient Registration & Triage
* **Authentication**: Walk-in patients sign in using Auth0 (Google or email credentials).
* **Onboarding**: First-time patients record baseline demographics (age, gender, height, weight). Returning patients bypass this step.
* **Clinical Survey**: A 4-step symptom questionnaire assesses chief complaints, red-flag symptoms, and severity (1 to 5).
* **Severity Classification**:
  * **Red (Level 5)**: Immediate emergency / red-flag indicators present.
  * **Orange (Level 4)**: Very urgent symptoms (severity 5/5).
  * **Yellow (Level 3)**: Urgent (severity 3-4).
  * **Green (Level 2)**: Standard OPD consultation.
  * **Blue (Level 1)**: Non-urgent routine checkup.

### Phase 2: Smart Seat Allocation & Wing Clustering
* The waiting area is arranged into two wings:
  * **Right Wing (R1, R2)**: Reserved for high-urgency patients (closer to base).
  * **Left Wing (L1, L2)**: Allocated for routine and non-urgent patients.
* **Travel Minimization**: Patients with identical severity tiers are dynamically grouped on the same wing. This prevents the robot from traversing between opposite sides of the clinic between visits.
* The patient's dashboard prominently displays their designated seat (e.g., "Seat R1") and live dispatch status.

### Phase 3: Autonomous Robot Navigation & Vitals Ingestion
* The ESP32 robot polls the backend job queue via HTTPS (`GET /api/robot/next`).
* It sorts pending requests by clinical severity first, then by registration time.
* The robot follows an optical line track (using a 5-channel BFD-1000 infrared sensor) to the patient's seat, playing status audio prompts and displaying animated OLED status faces.
* At the patient's chair:
  * **MAX30102 Sensor**: Collects photoplethysmogram (PPG) data to calculate Heart Rate (BPM) and Blood Oxygen Saturation (SpO2 %).
  * **DS18B20 Sensor**: Captures core skin temperature via digital 1-Wire bus.
* The readings are transmitted over HTTPS (`POST /api/robot/vitals`) to the cloud backend.
* Upon upload confirmation:
  * The seat is automatically freed in the database.
  * The robot announces completion and returns to home base.
  * The Patient and Doctor Dashboards update live without requiring a page refresh.

---

## 3. Hardware Architecture

### Microcontroller & Sensors
* **Microcontroller**: ESP32 DevKit V1 (30-pin, Dual-Core 240 MHz, 2.4 GHz Wi-Fi)
* **Pulse & Oximetry**: MAX30102 (I2C address `0x57`)
* **Body Temperature**: DS18B20 digital thermal probe (with 4.7 kOhm pull-up resistor)
* **Line Tracking**: BFD-1000 5-channel digital IR sensor module
* **Obstacle Detection**: HC-SR04 ultrasonic sensor with resistor voltage divider (1 kOhm / 2 kOhm)
* **Motor Driver**: L298N Dual H-Bridge for DC drive motors
* **Steering Actuator**: High-torque micro servo for mechanical steering angle control
* **Audio Synthesis**: MAX98357A I2S 3W Class-D amplifier driving an 8 Ohm speaker via LittleFS WAV playback
* **Visual Display**: SSD1306 0.96-inch I2C OLED display (`0x3C`)

### GPIO Pin Mapping

| Peripheral | ESP32 GPIO | Description / Connection |
| :--- | :--- | :--- |
| **I2S Audio (MAX98357A)** | GPIO 2 | BCLK (Bit Clock) |
| **I2S Audio (MAX98357A)** | GPIO 15 | LRC / WS (Word Select) |
| **I2S Audio (MAX98357A)** | GPIO 4 | DIN (Data Input) |
| **Motor Driver (L298N)** | GPIO 23 | ENA (Left Motor PWM Speed) |
| **Motor Driver (L298N)** | GPIO 26 | IN1 (Left Motor Direction A) |
| **Motor Driver (L298N)** | GPIO 27 | IN2 (Left Motor Direction B) |
| **Motor Driver (L298N)** | GPIO 5 | ENB (Right Motor PWM Speed) |
| **Motor Driver (L298N)** | GPIO 14 | IN3 (Right Motor Direction A) |
| **Motor Driver (L298N)** | GPIO 12 | IN4 (Right Motor Direction B) |
| **Steering Servo** | GPIO 13 | PWM Servo Signal Line |
| **BFD-1000 Line Sensor** | GPIO 34 | S1 (Left-most Sensor) |
| **BFD-1000 Line Sensor** | GPIO 35 | S2 (Mid-Left Sensor) |
| **BFD-1000 Line Sensor** | GPIO 32 | S3 (Center Sensor) |
| **BFD-1000 Line Sensor** | GPIO 33 | S4 (Mid-Right Sensor) |
| **BFD-1000 Line Sensor** | GPIO 25 | S5 (Right-most Sensor) |
| **Ultrasonic (HC-SR04)** | GPIO 18 | TRIG (Trigger Output) |
| **Ultrasonic (HC-SR04)** | GPIO 19 | ECHO (Echo Input via Voltage Divider) |
| **Temperature (DS18B20)** | GPIO 16 (RX2) | 1-Wire Data Line |
| **I2C Bus (OLED + MAX30102)** | GPIO 21 | SDA (Shared Data Line) |
| **I2C Bus (OLED + MAX30102)** | GPIO 22 | SCL (Shared Clock Line) |
| **Spare / Unused** | GPIO 17 (TX2) | General Purpose I/O |

---

## 4. Software Architecture & Tech Stack

### Frontend Application
* **Framework**: React 19 with Vite
* **Styling**: Tailwind CSS
* **Icons & Animation**: Lucide React, CSS Transitions
* **Routing**: HashRouter (Single Page Application architecture)
* **Authentication**: Auth0 Universal Login (JWT-based session management)
* **Hosting**: Vercel

### Backend Service
* **Runtime**: Node.js with Express
* **Database Driver**: `pg` (PostgreSQL client with connection pooling)
* **Security & Network**: CORS-enabled REST endpoints, SSL transport security
* **Hosting**: Render Cloud Platform

### Database
* **Database**: PostgreSQL hosted on Supabase (AWS ap-southeast-2 region)
* **Connection Pooling**: Transaction Pooler (Port 6543)

### Embedded Firmware
* **Platform**: Arduino framework on ESP32
* **Libraries**: `WiFiClientSecure`, `HTTPClient`, `ArduinoJson` (v7), `Adafruit_SSD1306`, `ESP32Servo`, `DallasTemperature`, `MAX30105`, `ESP32-audioI2S`

---

## 5. Database Schema

### `patients`
Stores registered patient demographic records.
* `id`: SERIAL PRIMARY KEY
* `auth0_sub`: VARCHAR(255) UNIQUE NOT NULL (Permanent Auth0 User Identifier)
* `full_name`: VARCHAR(255)
* `email`: VARCHAR(255)
* `gender`: VARCHAR(50)
* `age`: INTEGER
* `weight_kg`: DECIMAL(5,2)
* `height_cm`: DECIMAL(5,2)
* `created_at`: TIMESTAMPTZ DEFAULT NOW()

### `readings`
Stores physiological sensor data captured by the robot.
* `id`: SERIAL PRIMARY KEY
* `patient_id`: INTEGER REFERENCES patients(id) ON DELETE CASCADE
* `heart_rate`: DECIMAL(6,2)
* `spo2`: DECIMAL(5,2)
* `temperature`: DECIMAL(5,2)
* `source`: VARCHAR(50) DEFAULT 'nuri_robot'
* `timestamp`: TIMESTAMPTZ DEFAULT NOW()

### `seats`
Maintains status and patient occupancy for hospital waiting-room chairs.
* `id`: SERIAL PRIMARY KEY
* `name`: VARCHAR(5) UNIQUE NOT NULL (`R1`, `R2`, `L1`, `L2`)
* `status`: VARCHAR(20) DEFAULT 'available' (`available` or `occupied`)
* `patient_id`: INTEGER REFERENCES patients(id) ON DELETE SET NULL
* `assigned_at`: TIMESTAMPTZ

### `robot_jobs`
Queue managing autonomous dispatch tasks for the robot.
* `id`: SERIAL PRIMARY KEY
* `patient_id`: INTEGER REFERENCES patients(id) ON DELETE CASCADE
* `patient_name`: VARCHAR(255)
* `destination`: VARCHAR(5) NOT NULL
* `status`: VARCHAR(20) DEFAULT 'pending' (`pending`, `in_progress`, `complete`)
* `priority`: VARCHAR(10) DEFAULT 'blue' (`red`, `orange`, `yellow`, `green`, `blue`)
* `created_at`: TIMESTAMPTZ DEFAULT NOW()
* `started_at`: TIMESTAMPTZ
* `completed_at`: TIMESTAMPTZ

---

## 6. Key REST API Endpoints

### Patient & Clinical Records
* `GET /api/patients`: Lists all registered patients.
* `GET /api/patients/:sub`: Retrieves demographic profile by Auth0 subject ID.
* `POST /api/patients`: Persists a new patient onboarding profile.
* `DELETE /api/patients/:sub`: Permanently deletes a patient, their readings, and releases their seat.
* `GET /api/patients/:sub/readings`: Retrieves historical vitals for a given patient.

### Seat Management
* `GET /api/seats`: Returns status and occupant data for all waiting seats.
* `POST /api/seats/assign`: Assigns an optimal seat based on clinical severity and wing clustering.
* `PATCH /api/seats/:name/release`: Manually releases an occupied seat.
* `GET /api/seats/current/:patient_id`: Retrieves current seat assignment for a specific patient.

### Robot Dispatch & Telemetry Ingestion
* `GET /api/robot/next`: Polled by the robot. Returns the highest-priority pending job (or HTTP 204 if queue is idle).
* `PATCH /api/robot/jobs/:id/start`: Updates job status to `in_progress`.
* `POST /api/robot/vitals`: Ingests heart rate, oxygen saturation, and body temperature. Marks the job complete and auto-releases the seat.

---

## 7. Local Development & Deployment

### Prerequisites
* Node.js v18+
* PostgreSQL instance (or Supabase project)
* Arduino IDE (with ESP32 board support and LittleFS uploader)

### Backend Setup
1. Navigate to the project root directory.
2. Configure `.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
   ALLOWED_ORIGIN=http://localhost:5173,https://your-frontend.vercel.app
   ```
3. Initialize the database schema:
   ```bash
   node server/setup-db.js
   ```
4. Start the server:
   ```bash
   node server/index.js
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build client assets:
   ```bash
   npm run build
   ```
3. Launch local Vite development server:
   ```bash
   npm run dev
   ```

### Firmware Setup
1. Open the `.ino` sketch in Arduino IDE.
2. Select target board: `ESP32 Dev Module`.
3. Set your 2.4 GHz Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "Your_SSID";
   const char* WIFI_PASSWORD = "Your_Password";
   const char* API_BASE_URL  = "https://your-backend.onrender.com";
   ```
4. Upload audio files (`.wav`) to LittleFS partition.
5. Compile and flash the sketch to the ESP32.
