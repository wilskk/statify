"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScreePlotData {
  component_numbers: number[];
  eigenvalues: number[];
}

interface ScreePlotProps {
  data: ScreePlotData | string;
}

export function ScreePlot({ data }: ScreePlotProps) {
  // Parse data if it's a JSON string
  let parsedData: ScreePlotData;
  
  try {
    if (typeof data === "string") {
      parsedData = JSON.parse(data);
    } else {
      parsedData = data;
    }
  } catch (error) {
    console.error("Failed to parse ScreePlot data:", error);
    return <p className="text-destructive">Invalid scree plot data: Failed to parse JSON</p>;
  }

  if (
    !parsedData ||
    !Array.isArray(parsedData.component_numbers) ||
    !Array.isArray(parsedData.eigenvalues)
  ) {
    console.error("Invalid ScreePlot data structure:", parsedData);
    return <p className="text-destructive">Invalid scree plot data: Missing component_numbers or eigenvalues</p>;
  }

  const chartData = parsedData.component_numbers.map((c, i) => ({
    component: c,
    eigenvalue: parsedData.eigenvalues[i] ?? 0,
  }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="component"
            label={{ value: "Component Number", position: "insideBottom", offset: -10 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ value: "Eigenvalue", angle: -90, position: "insideLeft", offset: 10 }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(3), "Eigenvalue"]}
            labelFormatter={(label) => `Component ${label}`}
          />
          <Line
            type="monotone"
            dataKey="eigenvalue"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ fill: "#8884d8", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

