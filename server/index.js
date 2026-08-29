import express from "express";
import cors from "cors";

/**
 * ============================================================================
 * Nuri Backend Web Service (Render / Railway / Localhost)
 * ============================================================================
 * REST API for OPD Triage Queue, Auth0 Patient Profiles, and ESP32 Telemetry
 */

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// In-Memory Data Store (Structured for future PostgreSQL / SQLite DB)
let opdDatabase = [
  {
    id: "MED-89422",
    name: "James Rodriguez",
    age: 52,
    gender: "Male",
    weight: "82 kg",
    height: "176 cm",
    timeWaiting: "12 mins ago",
    timeWaitingMinutes: 12,
    inQueue: true,
    status: "Ready for Consult",
    triage: {
      patientId: "MED-89422",
      chiefComplaint: "Chest pain",
      redFlags: {
        difficultyBreathing: false,
        severePain: true,
        suddenOnset: true,
        faintingOrSyncope: false
      },
      severityRating: 4,
      additionalSymptoms: ["Dizziness", "Body ache"],
      computedPriority: "red",
      submittedAt: "10:25 AM, Today"
    },
    vitals: {
      heartRate: 88,
      spO2: 96,
      temperature: 37.1,
      recordedAt: "10:37 AM",
      healthStatus: "Normal"
    },
    history: [
      { id: "JR-09", timestamp: "Today, 10:37 AM", heartRate: 88, spO2: 96, temperature: 37.1, status: "Normal" }
    ]
  },
  {
    id: "MED-89423",
    name: "Clara Oswald",
    age: 29,
    gender: "Female",
    weight: "57 kg",
    height: "165 cm",
    timeWaiting: "19 mins ago",
    timeWaitingMinutes: 19,
    inQueue: true,
    status: "Awaiting Vitals",
    triage: {
      patientId: "MED-89423",
      chiefComplaint: "Fever",
      redFlags: {
        difficultyBreathing: false,
        severePain: false,
        suddenOnset: false,
        faintingOrSyncope: false
      },
      severityRating: 5,
      additionalSymptoms: ["Chills", "Fatigue", "Body ache"],
      computedPriority: "orange",
      submittedAt: "10:18 AM, Today"
    },
    vitals: null,
    history: []
  }
];

// Health Check Endpoint (For Cloud Web Service Uptime Monitors)
app.get("/", (req, res) => {
  res.json({
    service: "nuri-backend",
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// GET /api/v1/opd/queue - Retrieve all OPD patients
app.get("/api/v1/opd/queue", (req, res) => {
  res.json({
    success: true,
    count: opdDatabase.length,
    data: opdDatabase
  });
});

// POST /api/v1/patients/onboarding - Register or update a patient
app.post("/api/v1/patients/onboarding", (req, res) => {
  const { patientId, auth0Sub, name, gender, age, weight, height, email, avatarUrl } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: "Patient name is required" });
  }

  const id = patientId || `MED-${Math.floor(10000 + Math.random() * 90000)}`;
  const existingIdx = opdDatabase.findIndex(p => p.id === id || (auth0Sub && p.auth0Sub === auth0Sub));

  const patientRecord = {
    id,
    auth0Sub: auth0Sub || null,
    name,
    gender: gender || "Female",
    age: Number(age) || 30,
    weight: typeof weight === "string" ? weight : `${weight} kg`,
    height: typeof height === "string" ? height : `${height} cm`,
    email: email || "",
    avatarUrl: avatarUrl || null,
    timeWaiting: "Just now",
    timeWaitingMinutes: 0,
    inQueue: true,
    status: "Ready for Consult",
    triage: null,
    vitals: null,
    history: []
  };

  if (existingIdx >= 0) {
    opdDatabase[existingIdx] = { ...opdDatabase[existingIdx], ...patientRecord };
    return res.json({ success: true, message: "Patient profile updated", data: opdDatabase[existingIdx] });
  } else {
    opdDatabase.unshift(patientRecord);
    return res.status(201).json({ success: true, message: "Patient registered", data: patientRecord });
  }
});

// POST /api/v1/patients/:id/triage - Record symptom survey & compute MTS priority
app.post("/api/v1/patients/:id/triage", (req, res) => {
  const { id } = req.params;
  const { chiefComplaint, redFlags = {}, severityRating = 1, additionalSymptoms = [] } = req.body;

  // Compute Manchester Triage Priority
  const hasRedFlag = Object.values(redFlags).some(v => v === true);
  let computedPriority = "blue";
  if (hasRedFlag) {
    computedPriority = "red";
  } else if (severityRating === 5) {
    computedPriority = "orange";
  } else if (severityRating === 3 || severityRating === 4) {
    computedPriority = "yellow";
  } else if (severityRating === 2) {
    computedPriority = "green";
  }

  const triageData = {
    patientId: id,
    chiefComplaint: chiefComplaint || "General",
    redFlags,
    severityRating,
    additionalSymptoms,
    computedPriority,
    submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Today"
  };

  const patient = opdDatabase.find(p => p.id === id);
  if (patient) {
    patient.triage = triageData;
    patient.inQueue = true;
  }

  res.json({
    success: true,
    data: triageData
  });
});

// POST /api/v1/patients/:id/vitals - Ingest ESP32 Telemetry with physiological validation
app.post("/api/v1/patients/:id/vitals", (req, res) => {
  const { id } = req.params;
  const { heartRate, spO2, temperature, captureStatus = "success", confidence = "high" } = req.body;

  // Physiological Bounds Check per ESP32 Readiness Spec
  if (heartRate !== undefined && (heartRate < 30 || heartRate > 220)) {
    return res.status(422).json({ success: false, error: "Heart rate out of physiological range (30-220 bpm)" });
  }
  if (spO2 !== undefined && (spO2 < 50 || spO2 > 100)) {
    return res.status(422).json({ success: false, error: "SpO2 out of physiological range (50-100%)" });
  }
  if (temperature !== undefined && (temperature < 30 || temperature > 42)) {
    return res.status(422).json({ success: false, error: "Temperature out of physiological range (30-42°C)" });
  }

  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const vitalsRecord = {
    heartRate: Number(heartRate),
    spO2: Number(spO2),
    temperature: Number(temperature),
    captureStatus,
    confidence,
    recordedAt: timestamp,
    healthStatus: "Normal"
  };

  const patient = opdDatabase.find(p => p.id === id);
  if (patient) {
    patient.vitals = vitalsRecord;
    patient.history.unshift({
      id: `READ-${Date.now()}`,
      timestamp: `Today, ${timestamp}`,
      heartRate: vitalsRecord.heartRate,
      spO2: vitalsRecord.spO2,
      temperature: vitalsRecord.temperature,
      status: "Normal"
    });
  }

  res.status(201).json({
    success: true,
    message: "Vitals ingested successfully",
    data: vitalsRecord
  });
});

// GET /api/v1/patients/:id/vitals/latest - Fetch latest patient vitals
app.get("/api/v1/patients/:id/vitals/latest", (req, res) => {
  const { id } = req.params;
  const patient = opdDatabase.find(p => p.id === id);
  if (!patient || !patient.vitals) {
    return res.status(404).json({ success: false, message: "No vitals recorded yet" });
  }
  res.json({
    success: true,
    data: patient.vitals
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Nuri Backend] Service listening on port ${PORT}`);
});
