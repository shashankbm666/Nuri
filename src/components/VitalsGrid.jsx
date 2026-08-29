import React from "react";
import VitalCard from "./VitalCard";

export default function VitalsGrid({ latestReading }) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100 tracking-tight">
          Biometric Readings
        </h2>
        <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal">
          {latestReading ? latestReading.syncedAgoText : "No reading on file"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Heart Rate */}
        <VitalCard
          title="Heart Rate"
          subtitle="Electrocardiogram"
          vitalData={latestReading?.heartRate}
          unit="bpm"
          standardRange="60 – 100 bpm"
        />

        {/* Oxygen (SpO2) */}
        <VitalCard
          title="Oxygen (SpO2)"
          subtitle="Pulse Oximetry"
          vitalData={latestReading?.spO2}
          unit="%"
          standardRange="95% – 100%"
        />

        {/* Temperature */}
        <VitalCard
          title="Temperature"
          subtitle="Infrared Sensor"
          vitalData={latestReading?.temperature}
          unit="°C"
          standardRange="36.1 – 37.2°C"
        />
      </div>
    </div>
  );
}
