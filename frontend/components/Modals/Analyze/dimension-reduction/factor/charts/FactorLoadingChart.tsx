"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import 'echarts-gl';

interface LoadingPoint {
  label: string;
  coordinates: number[];
  is_cross_loading?: boolean; // Flag untuk cross-loading detection
  loading_gap?: number; // Gap antara primary dan secondary loading
}

interface LoadingPlotData {
  axis_labels: string[];
  points: LoadingPoint[];
  has_cross_loading_issues?: boolean; // Flag global untuk ada tidaknya cross-loading
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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

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

  useEffect(() => {
    if (!chartContainerRef.current || !parsedData) return;

    // Initialize chart
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartContainerRef.current);
    }

    const chart = chartInstanceRef.current;

    if (is3D) {
      createOption3D();
    } else {
      createOption2D();
    }

    function createOption3D() {
      if (!parsedData) return;
      
      // Separate normal points and cross-loading points for 3D
      const normalPoints = parsedData.points.filter(point => !point.is_cross_loading);
      const crossLoadingPoints = parsedData.points.filter(point => point.is_cross_loading);
      
      // Prepare 3D scatter plot data for normal points
      const normalSeriesData = normalPoints.map(point => [
        point.coordinates[0],
        point.coordinates[1],
        point.coordinates[2],
        point.label,
        false // is_cross_loading flag
      ]);
      
      // Prepare 3D scatter plot data for cross-loading points
      const crossLoadingSeriesData = crossLoadingPoints.map(point => [
        point.coordinates[0],
        point.coordinates[1],
        point.coordinates[2],
        point.label,
        true // is_cross_loading flag
      ]);

      const option: any = {
        title: {
          text: 'Component Plot in Rotated Space',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          formatter: (params: any) => {
            if (params.componentSubType === 'scatter3D') {
              const [x, y, z, label, isCrossLoading] = params.value;
              let tooltip = `${label}<br/>Component 1: ${x.toFixed(3)}<br/>Component 2: ${y.toFixed(3)}<br/>Component 3: ${z.toFixed(3)}`;
              if (isCrossLoading) {
                tooltip += '<br/><span style="color: #dc2626; font-weight: bold;">⚠️ Cross-loading detected</span>';
              }
              return tooltip;
            }
            return '';
          },
        },
        grid3D: {
          axisPointer: {
            show: false,
          },
          viewControl: {
            autoRotate: false,
            rotateSensitivity: 1,
          },
          boxWidth: 120,
          boxDepth: 120,
          boxHeight: 120,
        },
        xAxis3D: {
          name: parsedData.axis_labels[0] || 'Component 1',
          type: 'value',
          min: -1.1,
          max: 1.1,
          splitLine: {
            show: true,
          },
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        yAxis3D: {
          name: parsedData.axis_labels[1] || 'Component 2',
          type: 'value',
          min: -1.1,
          max: 1.1,
          splitLine: {
            show: true,
          },
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        zAxis3D: {
          name: parsedData.axis_labels[2] || 'Component 3',
          type: 'value',
          min: -1.1,
          max: 1.1,
          splitLine: {
            show: true,
          },
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        series: [
          // Normal points (blue)
          {
            name: 'Loading',
            type: 'scatter3D',
            symbolSize: 8,
            data: normalSeriesData,
            itemStyle: {
              color: '#1f77b4',
              borderColor: '#000',
              borderWidth: 0.5,
            },
            emphasis: {
              itemStyle: {
                color: '#ff7f0e',
              },
              label: {
                show: true,
                formatter: (params: any) => params.value[3] || '',
                fontSize: 10,
              },
            },
            label: {
              show: true,
              formatter: (params: any) => params.value[3] || '',
              fontSize: 10,
              position: 'top',
            },
          },
          // Cross-loading points (red with visual distinction)
          {
            name: 'Cross-Loading',
            type: 'scatter3D',
            symbolSize: 12, // Larger size for cross-loading points
            symbol: 'rect', // Use rectangle symbol to simulate box effect
            data: crossLoadingSeriesData,
            itemStyle: {
              color: '#dc2626', // Red color
              borderColor: '#991b1b',
              borderWidth: 2,
            },
            emphasis: {
              itemStyle: {
                color: '#ef4444',
              },
              label: {
                show: true,
                formatter: (params: any) => params.value[3] || '',
                fontSize: 10,
              },
            },
            label: {
              show: true,
              formatter: (params: any) => params.value[3] || '',
              fontSize: 10,
              position: 'top',
              color: '#dc2626',
              fontWeight: 'bold',
            },
          },
        ],
      };

      chart.setOption(option);
    }

    function createOption2D() {
      if (!parsedData) return;
      
      // Separate normal points and cross-loading points
      const normalPoints = parsedData.points.filter(point => !point.is_cross_loading);
      const crossLoadingPoints = parsedData.points.filter(point => point.is_cross_loading);
      
      // Prepare 2D scatter plot data for normal points
      const normalSeriesData = normalPoints.map(point => ({
        value: [point.coordinates[0], point.coordinates[1]],
        name: point.label,
      }));
      
      // Prepare 2D scatter plot data for cross-loading points
      const crossLoadingSeriesData = crossLoadingPoints.map(point => ({
        value: [point.coordinates[0], point.coordinates[1]],
        name: point.label,
      }));

      // Create markArea data for cross-loading points (red boxes)
      const crossLoadingMarkArea = crossLoadingPoints.map(point => {
        const x = point.coordinates[0];
        const y = point.coordinates[1];
        const boxSize = 0.08; // Size of the red box around the point
        return [
          {
            name: point.label,
            xAxis: x - boxSize,
            yAxis: y - boxSize,
          },
          {
            xAxis: x + boxSize,
            yAxis: y + boxSize,
          }
        ];
      });

      const option: any = {
        title: {
          text: 'Component Plot in Rotated Space',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          formatter: (params: any) => {
            if (Array.isArray(params.value)) {
              const [x, y] = params.value;
              const isCrossLoading = crossLoadingPoints.some(p => p.label === params.name);
              let tooltip = `${params.name}<br/>Component 1: ${x.toFixed(3)}<br/>Component 2: ${y.toFixed(3)}`;
              if (isCrossLoading) {
                tooltip += '<br/><span style="color: #dc2626; font-weight: bold;">⚠️ Cross-loading detected</span>';
              }
              return tooltip;
            }
            return '';
          },
        },
        xAxis: {
          name: parsedData.axis_labels[0] || 'Component 1',
          type: 'value',
          min: -1.1,
          max: 1.1,
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        yAxis: {
          name: parsedData.axis_labels[1] || 'Component 2',
          type: 'value',
          min: -1.1,
          max: 1.1,
          axisLine: {
            lineStyle: {
              color: '#000',
              width: 2,
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
            },
          },
          nameTextStyle: {
            fontSize: 12,
            color: '#333',
          },
        },
        grid: {
          left: 60,
          right: 40,
          top: 60,
          bottom: 60,
        },
        series: [
          // Normal points (blue)
          {
            name: 'Loading',
            type: 'scatter',
            symbolSize: 8,
            data: normalSeriesData,
            itemStyle: {
              color: '#1f77b4',
              borderColor: '#000',
              borderWidth: 0.5,
            },
            label: {
              show: true,
              formatter: (params: any) => params.name || '',
              fontSize: 10,
              position: 'top',
              color: '#333',
            },
            emphasis: {
              itemStyle: {
                color: '#ff7f0e',
                borderWidth: 1,
              },
              label: {
                show: true,
              },
            },
          },
          // Cross-loading points (with red box highlight)
          {
            name: 'Cross-Loading',
            type: 'scatter',
            symbolSize: 8,
            data: crossLoadingSeriesData,
            itemStyle: {
              color: '#dc2626', // Red color for cross-loading points
              borderColor: '#000',
              borderWidth: 0.5,
            },
            label: {
              show: true,
              formatter: (params: any) => params.name || '',
              fontSize: 10,
              position: 'top',
              color: '#dc2626', // Red label for cross-loading
              fontWeight: 'bold',
            },
            emphasis: {
              itemStyle: {
                color: '#ef4444',
                borderWidth: 1,
              },
              label: {
                show: true,
              },
            },
            // Red boxes around cross-loading points
            markArea: {
              silent: true,
              itemStyle: {
                color: 'rgba(220, 38, 38, 0.1)', // Light red fill
                borderColor: '#dc2626', // Red border
                borderWidth: 2,
                borderType: 'solid',
              },
              data: crossLoadingMarkArea,
            },
          },
        ],
      };

      chart.setOption(option);
    }

    // Handle window resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [parsedData, is3D]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

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

  // Check if there are any cross-loading issues
  const hasCrossLoadingIssues = parsedData.has_cross_loading_issues || 
    parsedData.points.some(point => point.is_cross_loading);

  return (
    <div className="w-full flex flex-col border rounded-lg p-4 bg-white shadow-sm">
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: '600px',
          minHeight: '500px',
        }}
      />
      
      {/* Cross-Loading Detection Warning */}
      {hasCrossLoadingIssues && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-red-700 font-medium text-sm">
                Warning: Variables in red boxes show signs of cross-loading.
              </p>
              <p className="text-red-600 text-sm mt-1">
                Consider reviewing these items to improve the overall validity of your model.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
