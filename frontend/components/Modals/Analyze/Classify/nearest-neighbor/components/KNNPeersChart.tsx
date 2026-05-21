import React, { useMemo } from "react";

export type KNNPeerNeighbor = {
  id: number | string;
  distance: number;
};

export type KNNPeerPoint = {
  id: number | string;
  label?: string;
  x: number;
  y: number;
  z?: number;
  type: string;
  target: string;
  targetNumber?: number | null;
  observed?: string;
  predicted?: string;
  predictorValues?: number[];
  focal?: boolean;
  neighbors?: KNNPeerNeighbor[];
};

export type KNNPeerAxisInfo = {
  name?: string;
  measure?: string;
  categories?: string[];
  ticks?: Array<{ value: number; label: string }>;
};

type PeerVariable = {
  name: string;
  axis?: KNNPeerAxisInfo;
  index: number;
  isTarget?: boolean;
};

type KNNPeersChartProps = {
  axes: KNNPeerAxisInfo[];
  colorForPoint: (point: KNNPeerPoint) => string;
  currentK: number;
  isNumericTarget: boolean;
  points: KNNPeerPoint[];
  selectedId: number | string | null;
  targetVariable: string;
};

export default function KNNPeersChart({
  axes,
  colorForPoint,
  currentK,
  isNumericTarget,
  points,
  selectedId,
  targetVariable,
}: KNNPeersChartProps) {
  const pointById = useMemo(
    () => new Map(points.map((point) => [String(point.id), point])),
    [points],
  );
  const pointOrderById = useMemo(
    () => new Map(points.map((point, index) => [String(point.id), index])),
    [points],
  );
  const focalPoint = useMemo(() => {
    if (selectedId !== null) return pointById.get(String(selectedId)) ?? null;
    return points.find((point) => point.focal) ?? null;
  }, [pointById, points, selectedId]);
  const peerPoints = useMemo(() => {
    if (!focalPoint) return [];

    const neighbors = (focalPoint.neighbors ?? [])
      .slice(0, currentK)
      .map((neighbor, index) => {
        const point = pointById.get(String(neighbor.id));
        return point ? { point, role: `N${index + 1}` } : null;
      })
      .filter((item): item is { point: KNNPeerPoint; role: string } =>
        Boolean(item),
      );

    return [{ point: focalPoint, role: "Focal" }, ...neighbors].sort(
      (left, right) =>
        (pointOrderById.get(String(left.point.id)) ?? Number.MAX_SAFE_INTEGER) -
        (pointOrderById.get(String(right.point.id)) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [currentK, focalPoint, pointById, pointOrderById]);
  const variables = useMemo<PeerVariable[]>(
    () => [
      { name: targetVariable || "Target", index: -1, isTarget: true },
      ...axes.map((axis, index) => ({
        name: axis.name ?? `Predictor ${index + 1}`,
        axis,
        index,
      })),
    ],
    [axes, targetVariable],
  );

  if (!focalPoint) {
    return (
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        <div className="text-base font-bold text-gray-900">Peers Chart</div>
        <div className="mt-2">
          Select a focal case in Predictor Space to show its nearest neighbors.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-center">
        <div className="text-base font-bold">Peers Chart</div>
        <div className="text-xs text-gray-600">
          Focal case: {focalPoint.label ?? focalPoint.id}, K = {currentK}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {variables.map((variable) => (
          <PeerSmallMultiple
            key={`${variable.isTarget ? "target" : "predictor"}-${variable.name}`}
            colorForPoint={colorForPoint}
            isNumericTarget={isNumericTarget}
            peerPoints={peerPoints}
            variable={variable}
          />
        ))}
      </div>
    </div>
  );
}

function PeerSmallMultiple({
  colorForPoint,
  isNumericTarget,
  peerPoints,
  variable,
}: {
  colorForPoint: (point: KNNPeerPoint) => string;
  isNumericTarget: boolean;
  peerPoints: Array<{ point: KNNPeerPoint; role: string }>;
  variable: PeerVariable;
}) {
  const width = 260;
  const height = 210;
  const plot = { left: 62, right: 18, top: 24, bottom: 42 };
  const categorical = isPeerCategorical(variable, isNumericTarget);
  const categories = categorical ? peerCategories(variable, peerPoints) : [];
  const values = peerPoints
    .map(({ point }) => peerValue(point, variable, categories))
    .filter((value) => Number.isFinite(value));
  const yAxis = categorical
    ? {
        min: 0,
        max: Math.max(2, categories.length + 1),
        ticks: categories.map((label, index) => ({
          value: index + 1,
          label,
        })),
      }
    : numericPeerAxis(values);
  const spanY = yAxis.max - yAxis.min || 1;
  const innerWidth = width - plot.left - plot.right;
  const xPadding = Math.min(28, innerWidth / 5);
  const usableInnerWidth = Math.max(1, innerWidth - xPadding * 2);
  const scaleX = (index: number) =>
    plot.left +
    (peerPoints.length <= 1
      ? innerWidth / 2
      : xPadding + (index / (peerPoints.length - 1)) * usableInnerWidth);
  const scaleY = (value: number) =>
    height -
    plot.bottom -
    ((value - yAxis.min) / spanY) * (height - plot.top - plot.bottom);

  return (
    <div className="rounded-md border border-gray-200 p-3">
      <div
        className="mb-2 truncate text-center text-sm font-semibold"
        title={variable.name}
      >
        {variable.name}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[210px] w-full overflow-visible"
      >
        <rect
          x={plot.left}
          y={plot.top}
          width={innerWidth}
          height={height - plot.top - plot.bottom}
          fill="#ffffff"
        />
        {yAxis.ticks.map((tick) => {
          const y = scaleY(tick.value);
          return (
            <g key={`${variable.name}-${tick.value}-${tick.label}`}>
              <line
                x1={plot.left}
                y1={y}
                x2={width - plot.right}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="3 3"
              />
              <text
                x={plot.left - 7}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill="#4b5563"
              >
                {tick.label}
              </text>
            </g>
          );
        })}
        <line
          x1={plot.left}
          y1={height - plot.bottom}
          x2={width - plot.right}
          y2={height - plot.bottom}
          stroke="#9ca3af"
        />
        <line
          x1={plot.left}
          y1={plot.top}
          x2={plot.left}
          y2={height - plot.bottom}
          stroke="#9ca3af"
        />
        {peerPoints.map(({ point, role }, index) => {
          const value = peerValue(point, variable, categories);
          if (!Number.isFinite(value)) return null;

          const x = scaleX(index);
          const y = scaleY(value);
          const isFocal = role === "Focal";
          const label = point.label ?? String(point.id);
          const radius = isFocal ? 5.8 : 4.8;
          const stroke = isFocal ? "#dc2626" : "#1f2937";
          const strokeWidth = isFocal ? 2.3 : 1;
          const title = `${role}: ${label} (${peerDisplayValue(point, variable, categories)})`;

          return (
            <g key={`${variable.name}-${point.id}-${role}`}>
              {point.type === "Holdout" && !isNumericTarget ? (
                <path
                  d={`M ${x} ${y - radius} L ${x + radius} ${y + radius} L ${
                    x - radius
                  } ${y + radius} Z`}
                  fill={colorForPoint(point)}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                >
                  <title>{title}</title>
                </path>
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={colorForPoint(point)}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                >
                  <title>{title}</title>
                </circle>
              )}
              <text x={x + 7} y={y - 6} fontSize={8} fill="#374151">
                {shortCaseLabel(label)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function isPeerCategorical(variable: PeerVariable, isNumericTarget: boolean) {
  if (variable.isTarget) return !isNumericTarget;

  const measure = variable.axis?.measure;
  if (measure === "nominal") return true;
  if (measure !== "ordinal") return false;

  const tickLabels = variable.axis?.ticks?.map((tick) => tick.label) ?? [];
  return tickLabels.some((label) => !Number.isFinite(Number(label)));
}

function peerCategories(
  variable: PeerVariable,
  peerPoints: Array<{ point: KNNPeerPoint; role: string }>,
) {
  if (variable.isTarget) {
    return Array.from(
      new Set(peerPoints.map(({ point }) => point.target || "(blank)")),
    );
  }

  const axisTicks = variable.axis?.ticks ?? [];
  if (axisTicks.length) {
    return axisTicks
      .slice()
      .sort((left, right) => Number(left.value) - Number(right.value))
      .map((tick) => tick.label);
  }

  const axisCategories = variable.axis?.categories?.filter(Boolean) ?? [];
  if (axisCategories.length) return axisCategories;

  return Array.from(
    new Set(
      peerPoints.map(({ point }) =>
        formatPeerValue(pointAxisValue(point, variable.index, Number.NaN)),
      ),
    ),
  );
}

function peerValue(
  point: KNNPeerPoint,
  variable: PeerVariable,
  categories: string[],
) {
  if (variable.isTarget) {
    if (categories.length) {
      return Math.max(1, categories.indexOf(point.target || "(blank)") + 1);
    }

    return finiteNumber(point.targetNumber, Number.NaN);
  }

  return pointAxisValue(point, variable.index, Number.NaN);
}

function peerDisplayValue(
  point: KNNPeerPoint,
  variable: PeerVariable,
  categories: string[],
) {
  if (variable.isTarget && categories.length) return point.target || "(blank)";

  const value = peerValue(point, variable, categories);
  if (categories.length) {
    return categories[Math.max(0, Math.trunc(value) - 1)] ?? "";
  }

  return formatPeerValue(value);
}

function numericPeerAxis(values: number[]) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (!finiteValues.length) {
    return {
      min: 0,
      max: 1,
      ticks: createNiceTicks(0, 1).map((value) => ({
        value,
        label: formatPeerValue(value),
      })),
    };
  }

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const span = max - min;
  const padding = span > 0 ? span * 0.15 : Math.max(Math.abs(min) * 0.1, 0.5);
  const paddedMin = min - padding;
  const paddedMax = max + padding;
  const ticks = createNiceTicks(paddedMin, paddedMax);

  return {
    min: Math.min(paddedMin, ticks[0] ?? paddedMin),
    max: Math.max(paddedMax, ticks[ticks.length - 1] ?? paddedMax),
    ticks: ticks.map((value) => ({
      value,
      label: formatPeerValue(value),
    })),
  };
}

function pointAxisValue(
  point: KNNPeerPoint,
  axisIndex: number,
  fallback: number,
) {
  const value = point.predictorValues?.[axisIndex];
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function finiteNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function createNiceTicks(min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (Math.abs(max - min) < Number.EPSILON) return [max];

  const step = niceTickStep((max - min) / 5);
  let start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;

  if (start === 0 && min > 0) {
    start = step;
  }

  const tickCount = Math.round((end - start) / step) + 1;
  return Array.from({ length: Math.max(0, tickCount) }, (_, index) =>
    roundTick(start + step * index, step),
  );
}

function niceTickStep(rawStep: number) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;

  const exponent = Math.floor(Math.log10(rawStep));
  const magnitude = 10 ** exponent;
  const fraction = rawStep / magnitude;

  if (fraction <= 1) return magnitude;
  if (fraction <= 2) return 2 * magnitude;
  if (fraction <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function roundTick(value: number, step: number) {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 2);
  return Number(value.toFixed(decimals));
}

function formatPeerValue(value: number) {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: Math.abs(value) < 1 ? 3 : 2,
  });
}

function shortCaseLabel(label: string) {
  return label.length > 9 ? `${label.slice(0, 8)}...` : label;
}
