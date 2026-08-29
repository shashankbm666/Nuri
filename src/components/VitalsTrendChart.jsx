import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";

export default function VitalsTrendChart({ history = [], darkMode }) {
  const [activeMetric, setActiveMetric] = useState("all"); // 'all' | 'hr' | 'spo2' | 'temp'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-center space-y-2">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <TrendingUp className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          No Longitudinal Telemetry Trend
        </h4>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs mx-auto">
          Historical trend curves and normal range bands will render as successive sensor readings are recorded.
        </p>
      </div>
    );
  }

  // Ensure chronological left-to-right order for trend line (oldest to newest)
  const chronological = [...history].reverse();
  const width = 640;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Metric definitions & normal ranges
  const metricConfigs = {
    hr: {
      key: "heartRate",
      label: "Heart Rate",
      unit: "bpm",
      minRange: 60,
      maxRange: 100,
      yMin: 50,
      yMax: 120,
      color: "#f43f5e", // rose-500
      normalBandColor: "rgba(244, 63, 94, 0.08)",
      isOutOfRange: (v) => v < 60 || v > 100
    },
    spo2: {
      key: "spO2",
      label: "Oxygen SpO2",
      unit: "%",
      minRange: 95,
      maxRange: 100,
      yMin: 90,
      yMax: 100,
      color: "#06b6d4", // cyan-500
      normalBandColor: "rgba(6, 182, 212, 0.08)",
      isOutOfRange: (v) => v < 95
    },
    temp: {
      key: "temperature",
      label: "Temperature",
      unit: "°C",
      minRange: 36.1,
      maxRange: 37.2,
      yMin: 35.5,
      yMax: 38.5,
      color: "#f59e0b", // amber-500
      normalBandColor: "rgba(245, 158, 11, 0.08)",
      isOutOfRange: (v) => v < 36.1 || v > 37.2
    }
  };

  const getCoordinates = (metricKey, config) => {
    return chronological.map((d, idx) => {
      const x = paddingLeft + (idx / (chronological.length - 1)) * chartWidth;
      const val = d[config.key];
      const yFraction = (val - config.yMin) / (config.yMax - config.yMin);
      const y = paddingTop + chartHeight - yFraction * chartHeight;
      const isAbnormal = config.isOutOfRange(val);
      return { x, y, val, timestamp: d.timestamp, isAbnormal, date: d.timestamp.split(",")[0] };
    });
  };

  const renderNormalBand = (config) => {
    const yTopFraction = (config.maxRange - config.yMin) / (config.yMax - config.yMin);
    const yBottomFraction = (config.minRange - config.yMin) / (config.yMax - config.yMin);
    const yTop = paddingTop + chartHeight - yTopFraction * chartHeight;
    const yBottom = paddingTop + chartHeight - yBottomFraction * chartHeight;
    const bandHeight = yBottom - yTop;

    return (
      <g>
        <rect
          x={paddingLeft}
          y={yTop}
          width={chartWidth}
          height={bandHeight}
          fill="rgba(16, 185, 129, 0.08)"
          stroke="rgba(16, 185, 129, 0.2)"
          strokeDasharray="3 3"
        />
        <text
          x={paddingLeft + 6}
          y={yTop + 12}
          fontSize="9"
          fill="#10b981"
          fontWeight="600"
          className="select-none"
        >
          Normal Band ({config.minRange}–{config.maxRange}{config.unit})
        </text>
      </g>
    );
  };

  const createPathD = (pts) => {
    return pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = pts[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, "");
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header & Metric Selection Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Longitudinal Vitals Trend
          </h3>
          <span className="text-xs text-slate-400">
            ({chronological.length} recorded readings)
          </span>
        </div>

        {/* Metric Filter Toggles */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
          <button
            onClick={() => setActiveMetric("all")}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              activeMetric === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveMetric("hr")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeMetric === "hr"
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-2xs font-semibold border border-rose-200/50"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Heart Rate</span>
          </button>
          <button
            onClick={() => setActiveMetric("spo2")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeMetric === "spo2"
                ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 shadow-2xs font-semibold border border-cyan-200/50"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>SpO2</span>
          </button>
          <button
            onClick={() => setActiveMetric("temp")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeMetric === "temp"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-2xs font-semibold border border-amber-200/50"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Temp</span>
          </button>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[560px]"
          aria-label="Patient longitudinal telemetry trend chart"
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + chartHeight * pct;
            return (
              <line
                key={i}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="1"
              />
            );
          })}

          {/* Normal Range Shading Band (When specific metric is selected) */}
          {activeMetric !== "all" && renderNormalBand(metricConfigs[activeMetric])}

          {/* Lines & Data Points */}
          {(activeMetric === "all" ? ["hr", "spo2", "temp"] : [activeMetric]).map((mKey) => {
            const cfg = metricConfigs[mKey];
            const pts = getCoordinates(mKey, cfg);
            const pathD = createPathD(pts);

            return (
              <g key={mKey}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={activeMetric === "all" ? 0.85 : 1}
                />
                {pts.map((pt, pIdx) => (
                  <g
                    key={pIdx}
                    onMouseEnter={() => setHoveredPoint({ ...pt, metric: cfg.label, unit: cfg.unit, color: cfg.color })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.isAbnormal ? 5.5 : 3.5}
                      fill={pt.isAbnormal ? "#ef4444" : cfg.color}
                      stroke="#ffffff"
                      strokeWidth={pt.isAbnormal ? "2" : "1.5"}
                      className={pt.isAbnormal ? "animate-pulse" : ""}
                    />
                    {pt.isAbnormal && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        className="animate-ping opacity-75"
                      />
                    )}
                  </g>
                ))}
              </g>
            );
          })}

          {/* X-Axis Timestamps */}
          {chronological.map((d, idx) => {
            if (idx % 2 !== 0 && chronological.length > 6) return null; // Space labels
            const x = paddingLeft + (idx / (chronological.length - 1)) * chartWidth;
            const label = d.timestamp.replace("Today, ", "");
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
                className="select-none font-mono"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Interactive Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`
            }}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
              <span>{hoveredPoint.metric}: {hoveredPoint.val} {hoveredPoint.unit}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{hoveredPoint.timestamp}</div>
            {hoveredPoint.isAbnormal && (
              <span className="text-[10px] text-rose-300 font-bold block mt-0.5">⚠️ Out of Normal Range</span>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Heart Rate (60-100 bpm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>SpO2 (95-100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Temp (36.1-37.2°C)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5" />
          <span>Red markers denote readings outside clinical reference standard</span>
        </div>
      </div>
    </div>
  );
}
