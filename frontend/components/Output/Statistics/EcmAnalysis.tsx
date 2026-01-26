import React from "react";
import DataTableRenderer from "@/components/Output/Table/DataTableRenderer";
import GeneralChartContainer from "@/components/Output/Chart/GeneralChartContainer";

interface EcmAnalysisProps {
  data: string; // JSON string containing { tables: [...], charts: [...] }
}

const EcmAnalysis: React.FC<EcmAnalysisProps> = ({ data }) => {
  let parsedData: { tables?: any[]; charts?: any[] } = {};

  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error("Failed to parse ECM analysis data:", error);
    return <div className="text-red-500">Error parsing results data.</div>;
  }

  const { tables, charts } = parsedData;

  return (
    <div className="space-y-8">
      {/* Tables Section */}
      {tables && tables.length > 0 && (
        <div className="space-y-4">
          <DataTableRenderer data={JSON.stringify({ tables })} />
        </div>
      )}

      {/* Charts Section */}
      {charts && charts.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {charts.map((chartConfig: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 shadow-sm bg-white">
              <GeneralChartContainer data={JSON.stringify(chartConfig)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EcmAnalysis;
