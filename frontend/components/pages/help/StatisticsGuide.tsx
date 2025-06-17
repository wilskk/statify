import React, { useState } from "react";
import {
  Frequencies,
  DescriptiveAnalysis,
  Explore,
  Crosstabs,
  TimeSeries,
  NonParametricTest,
  ParametricTest,
  LinearModel,
  Classification,
  Regression,
} from "./statistics-guide";

// Define the structure for each guide section
interface GuideSection {
  key: string;
  label: string;
  component: React.FC;
}

// Array of all available guide sections
const guideSections: GuideSection[] = [
  { key: "frequencies", label: "Frequencies", component: Frequencies },
  { key: "descriptive-analysis", label: "Descriptive Analysis", component: DescriptiveAnalysis },
  { key: "explore", label: "Explore", component: Explore },
  { key: "crosstabs", label: "Crosstabs", component: Crosstabs },
  { key: "time-series", label: "Time Series", component: TimeSeries },
  { key: "non-parametric", label: "Non-Parametric Test", component: NonParametricTest },
  { key: "parametric", label: "Parametric Test", component: ParametricTest },
  { key: "linear-model", label: "Linear Model", component: LinearModel },
  { key: "classification", label: "Classification", component: Classification },
  { key: "regression", label: "Regression", component: Regression },
];

interface StatisticsGuideProps {
  section?: string; // This prop can be used to set the initial section
}

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({ section }) => {
  // Determine the active section from props. Default to the first guide if none is selected.
  const activeKey = section || guideSections[0].key;
  const ActiveComponent = guideSections.find(s => s.key === activeKey)?.component;

  return (
    <div className="w-full">
      {ActiveComponent ? (
        <ActiveComponent />
      ) : (
        <p>Silakan pilih topik dari menu di samping untuk melihat panduan.</p>
      )}
    </div>
  );
}; 