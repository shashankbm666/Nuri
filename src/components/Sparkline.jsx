import React from "react";

/**
 * Minimalist SVG Sparkline with Withings/Apple Health styling.
 * Renders an 8-12 point trend line with an active endpoint dot.
 */
export default function Sparkline({ data = [], level = "green", width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 8) + 4;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    // Catmull-Rom or cubic bezier smoothing
    const prev = points[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, "");

  const lastPoint = points[points.length - 1];

  // Semantic color mapping
  const colorMap = {
    green: {
      stroke: "#16a34a", // emerald-600
      dot: "#16a34a",
      fill: "rgba(22, 163, 74, 0.08)"
    },
    amber: {
      stroke: "#d97706", // amber-600
      dot: "#d97706",
      fill: "rgba(217, 119, 6, 0.12)"
    },
    red: {
      stroke: "#dc2626", // rose-600
      dot: "#dc2626",
      fill: "rgba(220, 38, 38, 0.12)"
    },
    muted: {
      stroke: "#94a3b8", // slate-400
      dot: "#94a3b8",
      fill: "transparent"
    }
  };

  const colors = colorMap[level] || colorMap.green;

  return (
    <div className="w-full h-8 flex items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Active endpoint marker */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill={colors.dot}
          className="transition-transform duration-300"
        />
      </svg>
    </div>
  );
}
