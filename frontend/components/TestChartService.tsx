"use client";

import React, { useState } from "react";
import { DataProcessingService } from "../services/chart/DataProcessingService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartService } from "../services/chart/ChartService";

export default function TestChartService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartServiceOutput, setChartServiceOutput] = useState<any>(null);
  const [showChartServiceTest, setShowChartServiceTest] = useState(false);

  // Test data
  const testData = [
    ["Name", "Age", "Score"],
    ["John", "25", "85"],
    ["Jane", "30", "92"],
    ["Bob", "28", "78"],
    ["Alice", "22", "95"],
  ];

  const variables = [
    { name: "Name", type: "string" },
    { name: "Age", type: "number" },
    { name: "Score", type: "number" },
  ];

  // Test ChartService
  const testChartService = async () => {
    setLoading(true);
    setError(null);
    try {
      const processedData = await DataProcessingService.processDataForChart({
        chartType: "Vertical Bar Chart",
        rawData: testData,
        variables,
        chartVariables: {
          x: ["Name"],
          y: ["Score"],
        },
        processingOptions: {
          aggregation: "none",
          filterEmpty: true,
        },
      });

      console.log("Processed Data:", processedData);

      const chartResult = ChartService.createChartJSON({
        chartType: "Vertical Bar Chart",
        chartData: processedData.data,
        chartVariables: {
          x: ["Name"],
          y: ["Score"],
        },
        chartMetadata: {
          title: "Test Chart",
          subtitle: "Score by Name",
        },
      });

      console.log("Chart Result:", chartResult);
      setChartServiceOutput(chartResult);
      setShowChartServiceTest(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test ChartService with large dataset
  const testChartServiceLarge = async () => {
    setLoading(true);
    setError(null);
    try {
      // Generate large dataset
      const largeData = [["X", "Y"]];
      for (let i = 0; i < 1000; i++) {
        largeData.push([i.toString(), (Math.random() * 100).toString()]);
      }

      const largeVariables = [
        { name: "X", type: "number" },
        { name: "Y", type: "number" },
      ];

      const processedData = await DataProcessingService.processDataForChart({
        chartType: "Line Chart",
        rawData: largeData,
        variables: largeVariables,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
        processingOptions: {
          filterEmpty: true,
        },
      });

      console.log("Large Data Processed:", processedData);

      const chartResult = ChartService.createChartJSON({
        chartType: "Line Chart",
        chartData: processedData.data,
        chartVariables: {
          x: ["X"],
          y: ["Y"],
        },
        chartMetadata: {
          title: "Large Dataset Test",
          subtitle: "Random Values",
        },
      });

      console.log("Large Chart Result:", chartResult);
      setChartServiceOutput(chartResult);
      setShowChartServiceTest(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error:", error);
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>Test ChartService with small dataset</p>
            <Button onClick={testChartService} disabled={loading}>
              Run Test
            </Button>
          </div>
          <div>
            <p>Test ChartService with large dataset</p>
            <Button onClick={testChartServiceLarge} disabled={loading}>
              Run Large Test
            </Button>
          </div>
          {showChartServiceTest && (
            <div>
              <h3>Chart Service Output:</h3>
              <pre>{JSON.stringify(chartServiceOutput, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
