import React, { useMemo, useState } from "react";

type Neighbor = {
  id: number | string;
  distance: number;
};

type Point = {
  id: number | string;
  label?: string;
  x: number;
  y: number;
  z?: number;
  type: string;
  target: string;
  targetNumber?: number | null;
  observed?: string;
  focal?: boolean;
  neighbors?: Neighbor[];
};

type ChartPayload = {
  charts?: Array<{
    chartData: Point[];
    chartMetadata?: {
      title?: string;
    };
    chartConfig?: {
      width?: number;
      height?: number;
      axisLabels?: { x?: string; y?: string; z?: string };
      predictorSpace?: {
        selectedK: number;
        modelPredictors: number;
        actualPredictors: number;
        targetVariable: string;
        targetMeasure?: string;
        hasFocalCaseIdentifier?: boolean;
        instruction: string;
      };
    };
  }>;
};

type TooltipState = {
  x: number;
  y: number;
  html: React.ReactNode;
} | null;

const targetColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4b5563",
  "#dc2626",
];

function parsePayload(data: string | ChartPayload): ChartPayload {
  return typeof data === "string" ? JSON.parse(data) : data;
}

function formatDistance(value: number) {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function createFiveTicks(min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (Math.abs(max - min) < Number.EPSILON) return [max];

  const step = (max - min) / 5;
  return Array.from({ length: 5 }, (_, index) => min + step * (index + 1));
}

function formatTick(value: number) {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: Math.abs(value) < 1 ? 3 : 2,
  });
}

function formatNumericTargetTick(value: number) {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function interpolateColor(start: string, end: string, ratio: number) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const parse = (hex: string) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(start);
  const [r2, g2, b2] = parse(end);
  const toHex = (value: number) =>
    Math.round(value).toString(16).padStart(2, "0");

  return `#${toHex(r1 + (r2 - r1) * clamped)}${toHex(
    g1 + (g2 - g1) * clamped,
  )}${toHex(b1 + (b2 - b1) * clamped)}`;
}

export default function KNNPredictorSpaceChart({
  data,
}: {
  data: string | ChartPayload;
}) {
  const payload = useMemo(() => parsePayload(data), [data]);
  const chart = payload.charts?.[0];
  const points = (chart?.chartData ?? []).filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );
  const config = chart?.chartConfig?.predictorSpace;
  const width = chart?.chartConfig?.width ?? 900;
  const height = chart?.chartConfig?.height ?? 640;
  const svgWidth = width - 220;
  const svgHeight = height - 110;
  const maxK = Math.max(1, Number(config?.selectedK ?? 1));
  const isNumericTarget = config?.targetMeasure === "scale";

  const [currentK, setCurrentK] = useState(maxK);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const targetCategories = useMemo(
    () => Array.from(new Set(points.map((point) => point.target || "(blank)"))),
    [points],
  );
  const colorByTarget = useMemo(
    () =>
      new Map(
        targetCategories.map((target, index) => [
          target,
          targetColors[index % targetColors.length],
        ]),
      ),
    [targetCategories],
  );
  const numericTargets = useMemo(
    () =>
      points
        .map((point) => Number(point.targetNumber))
        .filter((value) => Number.isFinite(value)),
    [points],
  );
  const numericTargetMin = numericTargets.length ? Math.min(...numericTargets) : 0;
  const numericTargetMax = numericTargets.length ? Math.max(...numericTargets) : 0;
  const numericTargetSpan = numericTargetMax - numericTargetMin || 1;
  const numericTargetTicks = createFiveTicks(numericTargetMin, numericTargetMax)
    .reverse()
    .concat(
      Math.abs(numericTargetMax - numericTargetMin) < Number.EPSILON
        ? []
        : [numericTargetMin],
    );
  const numericTargetColor = (value: number | null | undefined) => {
    if (!Number.isFinite(Number(value))) return "#6b7280";
    return interpolateColor(
      "#2563eb",
      "#dc2626",
      (Number(value) - numericTargetMin) / numericTargetSpan,
    );
  };

  const projected = useMemo(
    () =>
      points.map((point) => {
        const z = Number(point.z ?? 0);
        return {
          point,
          x: point.x + z * 0.45,
          y: point.y - z * 0.35,
        };
      }),
    [points],
  );

  const rawXValues = points.map((point) => point.x);
  const rawYValues = points.map((point) => point.y);
  const rawZValues = points.map((point) => Number(point.z ?? 0));
  const rawXMin = Math.min(...rawXValues);
  const rawXMax = Math.max(...rawXValues);
  const rawYMin = Math.min(...rawYValues);
  const rawYMax = Math.max(...rawYValues);
  const rawZMin = Math.min(...rawZValues);
  const rawZMax = Math.max(...rawZValues);
  const hasZAxis =
    Boolean(chart?.chartConfig?.axisLabels?.z) &&
    rawZValues.some((value) => Number.isFinite(value) && Math.abs(value) > Number.EPSILON);
  const xTicks = createFiveTicks(rawXMin, rawXMax);
  const yTicks = createFiveTicks(rawYMin, rawYMax);
  const zTicks = hasZAxis ? createFiveTicks(rawZMin, rawZMax) : [];

  const xValues = projected.map((point) => point.x);
  const yValues = projected.map((point) => point.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const plot = { left: 58, right: 24, top: 28, bottom: 58 };
  const spanX = xMax - xMin || 1;
  const spanY = yMax - yMin || 1;
  const scaleX = (value: number) =>
    plot.left + ((value - xMin) / spanX) * (svgWidth - plot.left - plot.right);
  const scaleY = (value: number) =>
    svgHeight -
    plot.bottom -
    ((value - yMin) / spanY) * (svgHeight - plot.top - plot.bottom);
  const pointById = new Map(points.map((point) => [String(point.id), point]));
  const selectedPoint =
    selectedId === null ? null : pointById.get(String(selectedId)) ?? null;
  const hasFocalCaseIdentifier = Boolean(config?.hasFocalCaseIdentifier);
  const focalLinePoints = selectedPoint
    ? [selectedPoint]
    : hasFocalCaseIdentifier
      ? points
      : [];

  const projectedOf = (point: Point) => {
    const z = Number(point.z ?? 0);
    return {
      x: scaleX(point.x + z * 0.45),
      y: scaleY(point.y - z * 0.35),
    };
  };
  const projectedCoord = (xValue: number, yValue: number, zValue = 0) => ({
    x: scaleX(xValue + zValue * 0.45),
    y: scaleY(yValue - zValue * 0.35),
  });

  const showTooltip = (event: React.MouseEvent, html: React.ReactNode) => {
    const rect = (event.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect();
    setTooltip({
      x: event.clientX - (rect?.left ?? 0) + 10,
      y: event.clientY - (rect?.top ?? 0) - 42,
      html,
    });
  };

  if (!chart || points.length === 0) return null;

  return (
    <div className="relative mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div style={{ width, minHeight: height }} className="relative">
        <div className="mb-2 text-center">
          <div className="text-base font-bold">Predictor Space</div>
          <div className="text-xs text-gray-600">
            Built Model: {config?.modelPredictors ?? 0} selected predictors, K ={" "}
            {currentK}
          </div>
          {(config?.actualPredictors ?? 0) > 3 && (
            <div className="mt-1 text-xs text-gray-500">
              This chart is a lower-dimensional projection of the predictor
              space, which contains a total of {config?.actualPredictors}{" "}
              predictors
            </div>
          )}
        </div>

        <div className="mb-2 flex items-center justify-center gap-3">
          <label className="text-xs font-semibold">K: {currentK}</label>
          <input
            type="range"
            min={1}
            max={maxK}
            step={1}
            value={currentK}
            onChange={(event) => setCurrentK(Number(event.target.value))}
            className="w-44"
          />
        </div>

        <div className="flex items-start justify-center gap-4">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            {xTicks.map((tick) => {
              const x = projectedCoord(tick, rawYMin, 0).x;
              return (
                <g key={`x-tick-${tick}`}>
                  <line
                    x1={x}
                    y1={plot.top}
                    x2={x}
                    y2={svgHeight - plot.bottom}
                    stroke="#d1d5db"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={x}
                    y1={svgHeight - plot.bottom}
                    x2={x}
                    y2={svgHeight - plot.bottom + 5}
                    stroke="#6b7280"
                  />
                  <text
                    x={x}
                    y={svgHeight - plot.bottom + 18}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#4b5563"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              );
            })}

            {yTicks.map((tick) => {
              const y = projectedCoord(rawXMin, tick, 0).y;
              return (
                <g key={`y-tick-${tick}`}>
                  <line
                    x1={plot.left}
                    y1={y}
                    x2={svgWidth - plot.right}
                    y2={y}
                    stroke="#d1d5db"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={plot.left - 5}
                    y1={y}
                    x2={plot.left}
                    y2={y}
                    stroke="#6b7280"
                  />
                  <text
                    x={plot.left - 9}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={10}
                    fill="#4b5563"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              );
            })}

            {hasZAxis &&
              zTicks.map((tick) => {
                const start = projectedCoord(rawXMin, rawYMin, tick);
                const end = projectedCoord(rawXMax, rawYMin, tick);
                return (
                  <g key={`z-tick-${tick}`}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#d1d5db"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={start.x - 8}
                      y={start.y + 3}
                      textAnchor="end"
                      fontSize={10}
                      fill="#4b5563"
                    >
                      {formatTick(tick)}
                    </text>
                  </g>
                );
              })}

            <line
              x1={plot.left}
              y1={svgHeight - plot.bottom}
              x2={svgWidth - plot.right}
              y2={svgHeight - plot.bottom}
              stroke="#9ca3af"
            />
            <line
              x1={plot.left}
              y1={plot.top}
              x2={plot.left}
              y2={svgHeight - plot.bottom}
              stroke="#9ca3af"
            />
            {hasZAxis && (
              <line
                x1={projectedCoord(rawXMin, rawYMin, rawZMin).x}
                y1={projectedCoord(rawXMin, rawYMin, rawZMin).y}
                x2={projectedCoord(rawXMin, rawYMin, rawZMax).x}
                y2={projectedCoord(rawXMin, rawYMin, rawZMax).y}
                stroke="#9ca3af"
              />
            )}
            <text
              x={svgWidth / 2}
              y={svgHeight - 16}
              textAnchor="middle"
              fontSize={12}
              fill="#374151"
            >
              {chart.chartConfig?.axisLabels?.x ?? "X"}
            </text>
            <text
              x={16}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize={12}
              fill="#374151"
              transform={`rotate(-90 16 ${svgHeight / 2})`}
            >
              {chart.chartConfig?.axisLabels?.y ?? "Y"}
            </text>
            {hasZAxis && chart.chartConfig?.axisLabels?.z && (
              <text
                x={projectedCoord(rawXMin, rawYMin, rawZMax).x - 10}
                y={projectedCoord(rawXMin, rawYMin, rawZMax).y - 8}
                fontSize={12}
                fill="#374151"
                textAnchor="end"
              >
                {chart.chartConfig.axisLabels.z}
              </text>
            )}

            {focalLinePoints.flatMap((focalPoint) =>
              (focalPoint.neighbors ?? []).slice(0, currentK).map((neighbor) => {
                const neighborPoint = pointById.get(String(neighbor.id));
                if (!neighborPoint) return null;
                const start = projectedOf(focalPoint);
                const end = projectedOf(neighborPoint);
                return (
                  <g key={`${focalPoint.id}-${neighbor.id}`}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#dc2626"
                      strokeWidth={1.6}
                      strokeOpacity={selectedPoint ? 0.85 : 0.35}
                    />
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="transparent"
                      strokeWidth={10}
                      onMouseMove={(event) =>
                        showTooltip(event, <>Distance: {formatDistance(Number(neighbor.distance))}</>)
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </g>
                );
              }),
            )}

            {points.map((point) => {
              const projectedPoint = projectedOf(point);
              const isSelected = String(point.id) === String(selectedId);
              const fill = isNumericTarget
                ? numericTargetColor(point.targetNumber)
                : colorByTarget.get(point.target || "(blank)") ?? "#2563eb";
              const commonProps = {
                fill,
                stroke: isSelected ? "#dc2626" : "#1f2937",
                strokeWidth: isSelected ? 3 : 1,
                className: "cursor-pointer",
                onClick: () =>
                  setSelectedId((current) =>
                    String(current) === String(point.id) ? null : point.id,
                  ),
                onMouseMove: (event: React.MouseEvent<SVGElement>) =>
                  showTooltip(
                    event,
                    <>
                      <strong>Label:</strong> {point.label ?? point.id}
                      <br />
                      <strong>Observed:</strong> {point.observed ?? point.target}
                    </>,
                  ),
                onMouseLeave: () => setTooltip(null),
              };

              if (point.type === "Holdout") {
                const size = 8;
                const isFocal =
                  isSelected || (hasFocalCaseIdentifier && selectedId === null);
                return (
                  <polygon
                    key={String(point.id)}
                    points={`${projectedPoint.x},${projectedPoint.y - size} ${
                      projectedPoint.x - size
                    },${projectedPoint.y + size} ${projectedPoint.x + size},${
                      projectedPoint.y + size
                    }`}
                    {...commonProps}
                    stroke={isFocal ? "#dc2626" : "#1f2937"}
                    strokeWidth={isFocal ? 3 : 1}
                  />
                );
              }

              const isFocal =
                isSelected || (hasFocalCaseIdentifier && selectedId === null);
              return (
                <circle
                  key={String(point.id)}
                  cx={projectedPoint.x}
                  cy={projectedPoint.y}
                  r={6}
                  {...commonProps}
                  stroke={isFocal ? "#dc2626" : "#1f2937"}
                  strokeWidth={isFocal ? 3 : 1}
                />
              );
            })}
          </svg>

          <div className="w-44 text-xs leading-snug">
            <LegendSection title="Focal" />
            <LegendCircle label="No" />
            <LegendCircle label="Yes" outline="#dc2626" />
            <LegendSection title="Type" />
            <LegendCircle label="Training" fill="#6b7280" />
            {!isNumericTarget && (
              <div className="mb-1 flex items-center gap-2">
                <span className="h-0 w-0 border-b-[13px] border-l-[7px] border-r-[7px] border-b-gray-500 border-l-transparent border-r-transparent" />
                <span>Holdout</span>
              </div>
            )}
            <LegendSection title="Target" />
            <div className="mb-1">{config?.targetVariable ?? "Target"}</div>
            {isNumericTarget ? (
              <NumericGradientLegend
                ticks={numericTargetTicks}
                min={numericTargetMin}
                max={numericTargetMax}
              />
            ) : (
              targetCategories.map((target) => (
                <LegendCircle
                  key={target}
                  label={target}
                  fill={colorByTarget.get(target) ?? "#2563eb"}
                />
              ))
            )}
            <LegendSection title={`K: ${currentK}`} />
          </div>
        </div>

        <div className="mt-2 text-center text-xs text-gray-600">
          {config?.instruction ?? "Select points to use as focal records"}
        </div>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.html}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendSection({ title }: { title: string }) {
  return <div className="mb-1 mt-2 font-bold first:mt-0">{title}</div>;
}

function LegendCircle({
  label,
  fill = "#ffffff",
  outline = "#1f2937",
}: {
  label: string;
  fill?: string;
  outline?: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-full border-2"
        style={{ background: fill, borderColor: outline }}
      />
      <span>{label}</span>
    </div>
  );
}

function NumericGradientLegend({
  ticks,
  min,
  max,
}: {
  ticks: number[];
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <div
        className="h-32 w-4 rounded-sm border border-gray-300"
        style={{
          background: "linear-gradient(to bottom, #dc2626, #f59e0b, #2563eb)",
        }}
      />
      <div className="flex h-32 flex-col justify-between">
        {ticks.length > 0 ? (
          ticks.map((tick) => (
            <span key={`target-tick-${tick}`}>
              {formatNumericTargetTick(tick)}
            </span>
          ))
        ) : (
          <>
            <span>{formatNumericTargetTick(max)}</span>
            <span>{formatNumericTargetTick(min)}</span>
          </>
        )}
      </div>
    </div>
  );
}
