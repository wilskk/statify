"use client";

import React, { useState } from "react";
import { ChartService } from "../services/chart/ChartService";
import { DataProcessingService } from "../services/chart/DataProcessingService";
import { DataProcessingWorkerService } from "../services/chart/DataProcessingWorkerService";
import { SmartDataProcessingService } from "../services/chart/SmartDataProcessingService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function TestChartService() {
  const [chartJSON, setChartJSON] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [workerData, setWorkerData] = useState<any>(null);
  const [smartData, setSmartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample data
  const sampleRawData = [
    ["Product A", "Q1", 100],
    ["Product A", "Q2", 150],
    ["Product B", "Q1", 80],
    ["Product B", "Q2", 120],
  ];

  const sampleVariables = [
    { name: "product", type: "string" },
    { name: "quarter", type: "string" },
    { name: "sales", type: "number" },
  ];

  // Test ChartService
  const testChartService = () => {
    const testData = [
      { category: "A", value: 30 },
      { category: "B", value: 80 },
      { category: "C", value: 45 },
      { category: "D", value: 60 },
    ];

    const result = ChartService.createChartJSON({
      chartType: "Vertical Bar Chart",
      chartData: testData,
      chartVariables: {
        x: ["category"],
        y: ["value"],
      },
      chartMetadata: {
        title: "Test Chart",
        subtitle: "Sample Data",
      },
    });

    setChartJSON(result);
    console.log("ChartService Result:", result);
  };

  // Test DataProcessingService
  const testDataProcessingService = () => {
    const result = DataProcessingService.processDataForChart({
      chartType: "Vertical Stacked Bar Chart",
      rawData: sampleRawData,
      variables: sampleVariables,
      chartVariables: {
        x: ["product"],
        y: ["quarter"],
      },
      processingOptions: {
        aggregation: "sum",
        filterEmpty: true,
      },
    });

    setProcessedData(result);
    console.log("DataProcessingService Result:", result);
  };

  // Test DataProcessingWorkerService
  const testDataProcessingWorkerService = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await DataProcessingWorkerService.processData({
        chartType: "Vertical Stacked Bar Chart",
        rawData: sampleRawData,
        variables: sampleVariables,
        chartVariables: {
          x: ["product"],
          y: ["quarter"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      });

      setWorkerData(result);
      console.log("DataProcessingWorkerService Result:", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Worker Service Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test SmartDataProcessingService
  const testSmartDataProcessingService = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SmartDataProcessingService.processData({
        chartType: "Vertical Stacked Bar Chart",
        rawData: sampleRawData,
        variables: sampleVariables,
        chartVariables: {
          x: ["product"],
          y: ["quarter"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      });

      setSmartData(result);
      console.log("SmartDataProcessingService Result:", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Smart Service Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test SmartDataProcessingService dengan data besar (force async)
  const testSmartDataProcessingServiceLarge = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate large dataset
      const largeData = Array.from({ length: 2000 }, (_, i) => [
        `Product ${Math.floor(i / 100)}`,
        `Q${(i % 4) + 1}`,
        Math.random() * 1000,
      ]);

      const result = await SmartDataProcessingService.processData({
        chartType: "Vertical Stacked Bar Chart",
        rawData: largeData,
        variables: sampleVariables,
        chartVariables: {
          x: ["product"],
          y: ["quarter"],
        },
        processingOptions: {
          aggregation: "sum",
          filterEmpty: true,
        },
      });

      setSmartData(result);
      console.log("SmartDataProcessingService Large Data Result:", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Smart Service Large Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Chart Service Testing</h1>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Alert>
          <AlertDescription>Processing data...</AlertDescription>
        </Alert>
      )}

      {/* ChartService Test */}
      <Card>
        <CardHeader>
          <CardTitle>ChartService Test</CardTitle>
          <CardDescription>Test ChartService.createChartJSON()</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testChartService}>Test ChartService</Button>
          {chartJSON && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(chartJSON, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DataProcessingService Test */}
      <Card>
        <CardHeader>
          <CardTitle>DataProcessingService Test</CardTitle>
          <CardDescription>
            Test DataProcessingService.processDataForChart()
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDataProcessingService}>
            Test DataProcessingService
          </Button>
          {processedData && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(processedData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DataProcessingWorkerService Test */}
      <Card>
        <CardHeader>
          <CardTitle>DataProcessingWorkerService Test</CardTitle>
          <CardDescription>
            Test DataProcessingWorkerService.processData()
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDataProcessingWorkerService} disabled={loading}>
            Test DataProcessingWorkerService
          </Button>
          {workerData && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(workerData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SmartDataProcessingService Test */}
      <Card>
        <CardHeader>
          <CardTitle>SmartDataProcessingService Test</CardTitle>
          <CardDescription>
            Test SmartDataProcessingService - Auto choose best method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testSmartDataProcessingService} disabled={loading}>
              Test Smart Service (Small Data)
            </Button>
            <Button
              onClick={testSmartDataProcessingServiceLarge}
              disabled={loading}
            >
              Test Smart Service (Large Data)
            </Button>
          </div>
          {smartData && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="outline">Method: {smartData.method}</Badge>
                  <Badge variant="outline">
                    Time: {smartData.processingTime}ms
                  </Badge>
                  <Badge variant="outline">
                    Size: {smartData.dataSize} rows
                  </Badge>
                </div>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(smartData.processedData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Workflow Test */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Workflow Test</CardTitle>
          <CardDescription>
            Test SmartDataProcessingService + ChartService integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={async () => {
              setLoading(true);
              setError(null);

              try {
                // Step 1: Process data with smart service
                const result = await SmartDataProcessingService.processData({
                  chartType: "Vertical Stacked Bar Chart",
                  rawData: sampleRawData,
                  variables: sampleVariables,
                  chartVariables: {
                    x: ["product"],
                    y: ["quarter"],
                  },
                  processingOptions: {
                    aggregation: "sum",
                    filterEmpty: true,
                  },
                });

                // Step 2: Generate chart JSON
                const chartJSON = ChartService.createChartJSON({
                  chartType: "Vertical Stacked Bar Chart",
                  chartData: result.processedData,
                  chartVariables: {
                    x: ["product"],
                    y: ["quarter"],
                  },
                  chartMetadata: {
                    title: "Product Sales by Quarter",
                    subtitle: "Smart Processing Workflow",
                  },
                });

                console.log("Complete Smart Workflow Result:", {
                  processingResult: result,
                  chartJSON,
                });
                alert(
                  `Complete smart workflow successful!\nMethod: ${result.method}\nTime: ${result.processingTime}ms\nCheck console for details.`
                );
              } catch (error) {
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
                setError(errorMessage);
                console.error("Complete Smart Workflow Error:", error);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Test Complete Smart Workflow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
