import React from "react";

export const AnalysisTools = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Statistical Analysis</h3>
      <p>Explore our comprehensive suite of statistical tools:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="border-l-[3px] border-blue-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Descriptive Statistics</h4>
          <p className="text-sm text-gray-600">Means, standard deviations, frequencies</p>
        </div>
        <div className="border-l-[3px] border-green-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Regression Analysis</h4>
          <p className="text-sm text-gray-600">Linear, multiple, logistic regression</p>
        </div>
        <div className="border-l-[3px] border-purple-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Clustering & Classification</h4>
          <p className="text-sm text-gray-600">K-means, hierarchical, discriminant</p>
        </div>
        <div className="border-l-[3px] border-orange-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Time Series Analysis</h4>
          <p className="text-sm text-gray-600">Forecasting, smoothing, decomposition</p>
        </div>
        <div className="border-l-[3px] border-red-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Hypothesis Testing</h4>
          <p className="text-sm text-gray-600">T-tests, ANOVA, non-parametric tests</p>
        </div>
        <div className="border-l-[3px] border-cyan-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Multivariate Analysis</h4>
          <p className="text-sm text-gray-600">Factor analysis, PCA, MANOVA</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTools; 