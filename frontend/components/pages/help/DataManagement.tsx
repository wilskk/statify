import React from "react";

export const DataManagement = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Managing Your Data</h3>
      <p>Statify provides powerful tools to manage your datasets:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="border-l-[3px] border-blue-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Import & Export</h4>
          <p className="text-sm text-gray-600">CSV, Excel, databases, and API connections</p>
        </div>
        <div className="border-l-[3px] border-green-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Data Cleaning</h4>
          <p className="text-sm text-gray-600">Filter, transform, and validate data</p>
        </div>
        <div className="border-l-[3px] border-purple-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Variable Properties</h4>
          <p className="text-sm text-gray-600">Set measurement levels and metadata</p>
        </div>
        <div className="border-l-[3px] border-amber-500 pl-3 py-1">
          <h4 className="font-medium text-sm">Derived Variables</h4>
          <p className="text-sm text-gray-600">Create calculated fields and transformations</p>
        </div>
      </div>
      <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-md">
        <p className="text-amber-800 text-sm">⚠️ Always back up your original data before performing transformations.</p>
      </div>
    </div>
  );
};

export default DataManagement; 