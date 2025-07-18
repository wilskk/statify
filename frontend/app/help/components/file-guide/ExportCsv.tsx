/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ExportCsv = () => {
  return (
    <HelpContentWrapper
      title="Exporting to CSV"
      description="This guide explains how to save your data as a Comma-Separated Values (.csv) file."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Steps to Export to a .csv File</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Ensure the data you want to export is currently loaded in the data editor.</li>
            <li>Navigate to the "File" menu and select "Export to CSV".</li>
            <li>A dialog will appear allowing you to configure export options.</li>
            <li>Enter a file name and choose your desired delimiter and decimal separator.</li>
            <li>Click "Export" to save the file to your computer.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-blue-50 border-blue-200">
        <Lightbulb className="h-5 w-5 text-blue-600" />
        <AlertTitle>Data Integrity</AlertTitle>
        <AlertDescription>
          Exporting to CSV will save the raw data. Any variable properties, such as value labels or measurement levels, will not be included in the .csv file.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 