// Distinct, independent 10-point telemetry arrays per metric for the Patient Dashboard
export const initialSparklines = {
  heartRate: [72, 75, 78, 71, 74, 76, 73, 75, 77, 74],
  spO2: [98, 97, 98, 99, 98, 98, 97, 98, 99, 98],
  temperature: [36.4, 36.5, 36.6, 36.5, 36.7, 36.6, 36.5, 36.6, 36.7, 36.6]
};

// Rich multi-visit history & MTS triage data for Doctor Dashboard patients
export const doctorPatientDatabase = [
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
      { id: "JR-09", timestamp: "Today, 10:37 AM", heartRate: 88, spO2: 96, temperature: 37.1, status: "Normal" },
      { id: "JR-08", timestamp: "Aug 26, 03:00 PM", heartRate: 92, spO2: 95, temperature: 37.0, status: "Normal" },
      { id: "JR-07", timestamp: "Aug 21, 10:15 AM", heartRate: 86, spO2: 96, temperature: 36.9, status: "Normal" },
      { id: "JR-06", timestamp: "Aug 14, 09:45 AM", heartRate: 90, spO2: 96, temperature: 37.0, status: "Normal" },
      { id: "JR-05", timestamp: "Aug 07, 02:30 PM", heartRate: 84, spO2: 97, temperature: 36.8, status: "Normal" },
      { id: "JR-04", timestamp: "Jul 28, 11:00 AM", heartRate: 89, spO2: 96, temperature: 37.1, status: "Normal" },
      { id: "JR-03", timestamp: "Jul 15, 04:00 PM", heartRate: 94, spO2: 95, temperature: 37.2, status: "Attention" },
      { id: "JR-02", timestamp: "Jul 02, 10:30 AM", heartRate: 86, spO2: 97, temperature: 36.9, status: "Normal" },
      { id: "JR-01", timestamp: "Jun 20, 09:00 AM", heartRate: 88, spO2: 96, temperature: 37.0, status: "Normal" }
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
    history: [
      { id: "CO-08", timestamp: "Aug 22, 02:00 PM", heartRate: 72, spO2: 99, temperature: 36.5, status: "Normal" },
      { id: "CO-07", timestamp: "Aug 12, 11:15 AM", heartRate: 70, spO2: 99, temperature: 36.6, status: "Normal" },
      { id: "CO-06", timestamp: "Aug 01, 09:30 AM", heartRate: 75, spO2: 98, temperature: 36.4, status: "Normal" },
      { id: "CO-05", timestamp: "Jul 19, 03:45 PM", heartRate: 68, spO2: 100, temperature: 36.5, status: "Normal" },
      { id: "CO-04", timestamp: "Jul 08, 10:00 AM", heartRate: 74, spO2: 99, temperature: 36.6, status: "Normal" },
      { id: "CO-03", timestamp: "Jun 24, 01:20 PM", heartRate: 71, spO2: 99, temperature: 36.5, status: "Normal" },
      { id: "CO-02", timestamp: "Jun 10, 11:00 AM", heartRate: 73, spO2: 98, temperature: 36.6, status: "Normal" },
      { id: "CO-01", timestamp: "May 28, 10:30 AM", heartRate: 69, spO2: 99, temperature: 36.5, status: "Normal" }
    ]
  },
  {
    id: "MED-89421",
    name: "Eleanor Vance",
    age: 38,
    gender: "Female",
    weight: "63 kg",
    height: "168 cm",
    timeWaiting: "4 mins ago",
    timeWaitingMinutes: 4,
    inQueue: true,
    status: "Ready for Consult",
    triage: {
      patientId: "MED-89421",
      chiefComplaint: "Trouble breathing",
      redFlags: {
        difficultyBreathing: false,
        severePain: false,
        suddenOnset: false,
        faintingOrSyncope: false
      },
      severityRating: 3,
      additionalSymptoms: ["Fatigue", "Cough"],
      computedPriority: "yellow",
      submittedAt: "10:32 AM, Today"
    },
    vitals: {
      heartRate: 78,
      spO2: 98,
      temperature: 36.6,
      recordedAt: "10:45 AM",
      healthStatus: "Optimal"
    },
    history: [
      { id: "EV-10", timestamp: "Today, 10:45 AM", heartRate: 78, spO2: 98, temperature: 36.6, status: "Normal" },
      { id: "EV-09", timestamp: "Aug 27, 09:30 AM", heartRate: 74, spO2: 99, temperature: 36.5, status: "Normal" },
      { id: "EV-08", timestamp: "Aug 24, 02:15 PM", heartRate: 82, spO2: 97, temperature: 36.7, status: "Normal" },
      { id: "EV-07", timestamp: "Aug 20, 11:00 AM", heartRate: 88, spO2: 98, temperature: 36.8, status: "Normal" },
      { id: "EV-06", timestamp: "Aug 15, 10:20 AM", heartRate: 76, spO2: 98, temperature: 36.6, status: "Normal" },
      { id: "EV-05", timestamp: "Aug 10, 04:45 PM", heartRate: 80, spO2: 97, temperature: 36.6, status: "Normal" },
      { id: "EV-04", timestamp: "Aug 02, 09:15 AM", heartRate: 75, spO2: 99, temperature: 36.5, status: "Normal" },
      { id: "EV-03", timestamp: "Jul 25, 01:30 PM", heartRate: 84, spO2: 98, temperature: 36.7, status: "Normal" },
      { id: "EV-02", timestamp: "Jul 18, 10:00 AM", heartRate: 79, spO2: 97, temperature: 36.6, status: "Normal" },
      { id: "EV-01", timestamp: "Jul 05, 11:30 AM", heartRate: 76, spO2: 98, temperature: 36.5, status: "Normal" }
    ]
  },
  // Past Patients for Search Demonstration (Not in the current 3-person OPD Queue)
  {
    id: "MED-89410",
    name: "Sarah Jenkins",
    age: 45,
    gender: "Female",
    weight: "68 kg",
    height: "170 cm",
    timeWaiting: "Past Consultation",
    timeWaitingMinutes: 0,
    inQueue: false,
    status: "Completed Consult",
    triage: {
      patientId: "MED-89410",
      chiefComplaint: "Chest pain",
      redFlags: {
        difficultyBreathing: true,
        severePain: true,
        suddenOnset: true,
        faintingOrSyncope: false
      },
      severityRating: 5,
      additionalSymptoms: ["Fatigue", "Dizziness"],
      computedPriority: "red",
      submittedAt: "Aug 28, 04:10 PM"
    },
    vitals: {
      heartRate: 106,
      spO2: 94,
      temperature: 37.8,
      recordedAt: "Aug 28, 04:15 PM",
      healthStatus: "Elevated"
    },
    history: [
      { id: "SJ-08", timestamp: "Aug 28, 04:15 PM", heartRate: 106, spO2: 94, temperature: 37.8, status: "Attention" },
      { id: "SJ-07", timestamp: "Aug 25, 10:00 AM", heartRate: 98, spO2: 95, temperature: 37.4, status: "Normal" },
      { id: "SJ-06", timestamp: "Aug 18, 02:30 PM", heartRate: 85, spO2: 97, temperature: 36.9, status: "Normal" },
      { id: "SJ-05", timestamp: "Aug 11, 09:15 AM", heartRate: 82, spO2: 98, temperature: 36.7, status: "Normal" },
      { id: "SJ-04", timestamp: "Aug 03, 11:45 AM", heartRate: 88, spO2: 96, temperature: 36.8, status: "Normal" },
      { id: "SJ-03", timestamp: "Jul 21, 03:10 PM", heartRate: 84, spO2: 97, temperature: 36.6, status: "Normal" },
      { id: "SJ-02", timestamp: "Jul 09, 10:30 AM", heartRate: 78, spO2: 98, temperature: 36.5, status: "Normal" },
      { id: "SJ-01", timestamp: "Jun 18, 01:00 PM", heartRate: 76, spO2: 99, temperature: 36.6, status: "Normal" }
    ]
  },
  {
    id: "MED-89395",
    name: "Robert Fox",
    age: 61,
    gender: "Male",
    weight: "89 kg",
    height: "182 cm",
    timeWaiting: "Past Consultation",
    timeWaitingMinutes: 0,
    inQueue: false,
    status: "Completed Consult",
    triage: {
      patientId: "MED-89395",
      chiefComplaint: "Headache",
      redFlags: {
        difficultyBreathing: false,
        severePain: false,
        suddenOnset: false,
        faintingOrSyncope: false
      },
      severityRating: 2,
      additionalSymptoms: ["Body ache"],
      computedPriority: "green",
      submittedAt: "Aug 26, 11:20 AM"
    },
    vitals: {
      heartRate: 76,
      spO2: 97,
      temperature: 36.7,
      recordedAt: "Aug 26, 11:30 AM",
      healthStatus: "Normal"
    },
    history: [
      { id: "RF-08", timestamp: "Aug 26, 11:30 AM", heartRate: 76, spO2: 97, temperature: 36.7, status: "Normal" },
      { id: "RF-07", timestamp: "Aug 19, 02:15 PM", heartRate: 80, spO2: 96, temperature: 36.8, status: "Normal" },
      { id: "RF-06", timestamp: "Aug 10, 10:45 AM", heartRate: 74, spO2: 98, temperature: 36.6, status: "Normal" },
      { id: "RF-05", timestamp: "Jul 29, 09:00 AM", heartRate: 78, spO2: 97, temperature: 36.7, status: "Normal" },
      { id: "RF-04", timestamp: "Jul 16, 03:30 PM", heartRate: 82, spO2: 96, temperature: 36.8, status: "Normal" },
      { id: "RF-03", timestamp: "Jul 01, 11:00 AM", heartRate: 75, spO2: 98, temperature: 36.5, status: "Normal" },
      { id: "RF-02", timestamp: "Jun 15, 10:15 AM", heartRate: 77, spO2: 97, temperature: 36.6, status: "Normal" },
      { id: "RF-01", timestamp: "May 30, 02:00 PM", heartRate: 73, spO2: 98, temperature: 36.6, status: "Normal" }
    ]
  },
  {
    id: "MED-89380",
    name: "Elena Rostova",
    age: 34,
    gender: "Female",
    weight: "60 kg",
    height: "167 cm",
    timeWaiting: "Past Consultation",
    timeWaitingMinutes: 0,
    inQueue: false,
    status: "Completed Consult",
    triage: {
      patientId: "MED-89380",
      chiefComplaint: "Something else",
      redFlags: {
        difficultyBreathing: false,
        severePain: false,
        suddenOnset: false,
        faintingOrSyncope: false
      },
      severityRating: 1,
      additionalSymptoms: [],
      computedPriority: "blue",
      submittedAt: "Aug 25, 08:50 AM"
    },
    vitals: {
      heartRate: 68,
      spO2: 99,
      temperature: 36.5,
      recordedAt: "Aug 25, 09:00 AM",
      healthStatus: "Optimal"
    },
    history: [
      { id: "ER-08", timestamp: "Aug 25, 09:00 AM", heartRate: 68, spO2: 99, temperature: 36.5, status: "Normal" },
      { id: "ER-07", timestamp: "Aug 15, 03:00 PM", heartRate: 72, spO2: 99, temperature: 36.6, status: "Normal" },
      { id: "ER-06", timestamp: "Aug 05, 11:30 AM", heartRate: 70, spO2: 100, temperature: 36.4, status: "Normal" },
      { id: "ER-05", timestamp: "Jul 22, 02:15 PM", heartRate: 66, spO2: 99, temperature: 36.5, status: "Normal" },
      { id: "ER-04", timestamp: "Jul 10, 09:45 AM", heartRate: 71, spO2: 99, temperature: 36.6, status: "Normal" },
      { id: "ER-03", timestamp: "Jun 28, 01:30 PM", heartRate: 69, spO2: 98, temperature: 36.5, status: "Normal" },
      { id: "ER-02", timestamp: "Jun 12, 10:00 AM", heartRate: 67, spO2: 99, temperature: 36.4, status: "Normal" },
      { id: "ER-01", timestamp: "May 25, 11:15 AM", heartRate: 70, spO2: 99, temperature: 36.5, status: "Normal" }
    ]
  }
];
