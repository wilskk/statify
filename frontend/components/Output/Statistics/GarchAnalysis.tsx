import React from "react";
import DataTableRenderer from "@/components/Output/Table/DataTableRenderer";
import GeneralChartContainer from "@/components/Output/Chart/GeneralChartContainer";

interface GarchAnalysisProps {
  data: string; // JSON string containing { tables: [...], charts: [...] }
}

const GarchAnalysis: React.FC<GarchAnalysisProps> = ({ data }) => {
  let parsedData: { tables?: any[]; charts?: any[] } = {};

  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error("Failed to parse GARCH analysis data:", error);
    return <div className="text-red-500">Error parsing results data.</div>;
  }

  const { tables, charts } = parsedData;

  return (
    <div className="space-y-8">
      {/* Title / Meta info could be added here if included in data */}

      {/* Tables Section */}
      {tables && tables.length > 0 && (
        <div className="space-y-4">
            {/* 
                DataTableRenderer expects a JSON string with format { tables: [...] } 
                so we wrap our tables array back into that format.
            */}
          <DataTableRenderer data={JSON.stringify({ tables })} />
        </div>
      )}

      {/* Charts Section */}
      {charts && charts.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {charts.map((chartConfig: any, index: number) => (
             /* GeneralChartContainer expects a JSON string */
            <div key={index} className="border rounded-lg p-4 shadow-sm bg-white">
              <GeneralChartContainer data={JSON.stringify(chartConfig)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GarchAnalysis;
