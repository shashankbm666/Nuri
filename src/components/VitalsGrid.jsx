import React from 'react';
import { Heart, Activity, Thermometer, Clock } from 'lucide-react';
import VitalCard from './VitalCard';

export default function VitalsGrid({ latestReading, isCapturing }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Current Telemetry Vitals
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time biometric sensor feeds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Heart Rate */}
        <VitalCard
          title="Heart Rate"
          subtitle="Electrocardiogram"
          value={latestReading?.heartRate}
          unit="bpm"
          standardRange="60 - 100 bpm"
          status={latestReading?.status || 'Normal'}
          icon={Heart}
          theme="rose"
          isCapturing={isCapturing}
        />

        {/* Oxygen (SpO2) */}
        <VitalCard
          title="Oxygen (SpO2)"
          subtitle="Pulse Oximetry"
          value={latestReading?.spO2}
          unit="%"
          standardRange="95% - 100%"
          status={latestReading?.status || 'Normal'}
          icon={Activity}
          theme="teal"
          isCapturing={isCapturing}
        />

        {/* Temperature */}
        <VitalCard
          title="Temperature"
          subtitle="Infrared Sensor"
          value={latestReading?.temperature !== undefined ? `${latestReading.temperature}` : undefined}
          unit="°C"
          standardRange="36.1 - 37.2°C"
          status={latestReading?.status || 'Normal'}
          icon={Thermometer}
          theme="amber"
          isCapturing={isCapturing}
        />
      </div>

      {/* Last updated timestamp below the grid */}
      {latestReading && (
        <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>
            Last updated:{' '}
            <strong className="font-semibold text-slate-700 dark:text-slate-200">
              {latestReading.timestamp}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
