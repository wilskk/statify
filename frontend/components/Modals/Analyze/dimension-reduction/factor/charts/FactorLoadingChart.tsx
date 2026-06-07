"use client";

import React, { useMemo } from 'react';
import GeneralChartContainer from '@/components/Output/Chart/GeneralChartContainer';

interface LoadingPoint {
  label: string;
  coordinates: number[];
}

interface LoadingPlotData {
  axis_labels: string[];
  points: LoadingPoint[];
}

// Wrapper format from factor-analysis-output.ts
interface LoadingPlotWrapper {
  type: string;
  data: LoadingPlotData;
}

interface Props {
  data: LoadingPlotData | LoadingPlotWrapper | string;
}

export default function FactorLoadingChart({ data }: Props) {
  // Parse data if it's a JSON string and handle wrapped format
  const parsedData = useMemo<LoadingPlotData | null>(() => {
    try {
      let parsed: any;
      
      if (typeof data === "string") {
        parsed = JSON.parse(data);
      } else {
        parsed = data;
      }
      
      // Check if it's wrapped in { type, data } format
      if (parsed && parsed.type === "PLOTLY_LOADING_PLOT" && parsed.data) {
        return parsed.data as LoadingPlotData;
      }
      
      // Otherwise return as-is (direct LoadingPlotData format)
      return parsed as LoadingPlotData;
    } catch (error) {
      console.error("Failed to parse LoadingPlot data:", error);
      return null;
    }
  }, [data]);

  // Determine if 3D or 2D
  const is3D = parsedData?.axis_labels?.length ? parsedData.axis_labels.length >= 3 : false;

  // Build chart JSON for GeneralChartContainer
  const chartJSON = useMemo(() => {
    if (!parsedData || !parsedData.axis_labels || !parsedData.points) return null;

    if (is3D) {
      // Transform to Grouped 3D Scatter Plot (ECharts) format
      // Each variable becomes its own group so it appears in the legend
      const chartData = parsedData.points.map(point => ({
        x: point.coordinates[0],
        y: point.coordinates[1],
        z: point.coordinates[2],
        group: point.label,
      }));

      return {
        charts: [{
          chartType: "Grouped 3D Scatter Plot (ECharts)",
          chartData,
          chartConfig: {
            width: 800,
            height: 600,
            useAxis: true,
            axisLabels: {
              x: parsedData.axis_labels[0] || 'Component 1',
              y: parsedData.axis_labels[1] || 'Component 2',
              z: parsedData.axis_labels[2] || 'Component 3',
            },
            axisScaleOptions: {
              x: { min: "-1.1", max: "1.1" },
              y: { min: "-1.1", max: "1.1" },
              z: { min: "-1.1", max: "1.1" },
            },
          },
          chartMetadata: {
            title: 'Component Plot in Rotated Space',
            subtitle: `Factor Loadings (${parsedData.axis_labels.length} Components)`,
            description: 'Factor Loadings 3D Plot',
            axisInfo: {
              category: parsedData.axis_labels[0] || 'Component 1',
              value: parsedData.axis_labels[1] || 'Component 2',
            },
          },
        }],
      };
    } else {
      // Transform to Grouped Scatter Plot format
      // Each variable becomes a category so it appears in the legend
      const chartData = parsedData.points.map(point => ({
        category: point.label,
        x: point.coordinates[0],
        y: point.coordinates[1],
      }));

      return {
        charts: [{
          chartType: "Grouped Scatter Plot",
          chartData,
          chartConfig: {
            width: 800,
            height: 500,
            useAxis: true,
            axisLabels: {
              x: parsedData.axis_labels[0] || 'Component 1',
              y: parsedData.axis_labels[1] || 'Component 2',
            },
            axisScaleOptions: {
              x: { min: "-1.1", max: "1.1" },
              y: { min: "-1.1", max: "1.1" },
            },
          },
          chartMetadata: {
            title: 'Component Plot in Rotated Space',
            subtitle: `Factor Loadings (${parsedData.axis_labels.length} Components)`,
            description: 'Factor Loadings 2D Plot',
            axisInfo: {
              category: parsedData.axis_labels[0] || 'Component 1',
              value: parsedData.axis_labels[1] || 'Component 2',
            },
          },
        }],
      };
    }
  }, [parsedData, is3D]);

  // Error handling for invalid data
  if (!parsedData) {
    return (
      <div className="w-full flex justify-center items-center border rounded-lg p-4 bg-white shadow-sm h-[400px]">
        <p className="text-destructive">Invalid loading plot data: Failed to parse data</p>
      </div>
    );
  }

  if (!parsedData.axis_labels || !parsedData.points) {
    return (
      <div className="w-full flex justify-center items-center border rounded-lg p-4 bg-white shadow-sm h-[400px]">
        <p className="text-destructive">Invalid loading plot data: Missing axis_labels or points</p>
      </div>
    );
  }

  if (!chartJSON) {
    return (
      <div className="w-full flex justify-center items-center border rounded-lg p-4 bg-white shadow-sm h-[400px]">
        <p className="text-destructive">Failed to generate chart configuration</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center border rounded-lg p-4 bg-white shadow-sm">
      <div style={{ width: '100%', minHeight: is3D ? '600px' : '500px' }}>
        <GeneralChartContainer data={chartJSON} />
      </div>
    </div>
  );
}
