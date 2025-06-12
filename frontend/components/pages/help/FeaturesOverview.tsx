import React from "react";

export const FeaturesOverview = () => {
  return (
    <div className="space-y-4">
      <p>Statify offers a comprehensive suite of analytics and statistical tools:</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 border rounded-md hover:shadow-md transition">
          <h3 className="font-medium mb-1">Real-time Dashboard</h3>
          <p className="text-sm">Monitor key metrics with live updates and visualizations.</p>
        </div>
        <div className="p-3 border rounded-md hover:shadow-md transition">
          <h3 className="font-medium mb-1">Advanced Analytics</h3>
          <p className="text-sm">Perform statistical analysis with our built-in analytical tools.</p>
        </div>
        <div className="p-3 border rounded-md hover:shadow-md transition">
          <h3 className="font-medium mb-1">Customizable Reports</h3>
          <p className="text-sm">Create and schedule reports tailored to your specific needs.</p>
        </div>
        <div className="p-3 border rounded-md hover:shadow-md transition">
          <h3 className="font-medium mb-1">Data Export</h3>
          <p className="text-sm">Export data in multiple formats for further processing.</p>
        </div>
        <div className="p-3 border rounded-md hover:shadow-md transition">
          <h3 className="font-medium mb-1">Data Visualization</h3>
          <p className="text-sm">Create charts, graphs, and visual representations of your data.</p>
        </div>
        <div className="p-3 border rounded-md hover:shadow-md transition">
          <h3 className="font-medium mb-1">Collaboration</h3>
          <p className="text-sm">Share insights with team members and collaborate on analysis.</p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesOverview; 