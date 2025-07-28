/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const Print = () => {
  return (
    <HelpContentWrapper
      title="Printing Data"
      description="This section explains how to print your data view."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">How to Print Your Data</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Arrange the data view exactly as you want it to appear on the printed page.</li>
            <li>Go to "File" {'>'} "Print".</li>
            <li>This will open your browser's standard print dialog.</li>
            <li>Adjust settings like layout, paper size, and destination (e.g., a physical printer or "Save as PDF").</li>
            <li>Click "Print" to complete the action.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-gray-50 border-gray-200">
        <Lightbulb className="h-5 w-5 text-gray-600" />
        <AlertTitle>What You See Is What You Get</AlertTitle>
        <AlertDescription>
          The print function will capture the current state of the data grid. This includes any sorting, filtering, or column reordering you have applied.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 