/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ImportExcel = () => {
  return (
    <HelpContentWrapper
      title="Importing Excel Files"
      description="This guide covers how to import data from Microsoft Excel (.xls, .xlsx) files."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Steps to Import an Excel File</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Navigate to "File" {'>'} "Import from Excel".</li>
            <li>Click "Choose File" and select your Excel workbook.</li>
            <li>If your workbook has multiple sheets, select the correct one from the dropdown.</li>
            <li>Check the "Read variable names from the first row of data" option if applicable.</li>
            <li>Click "Import" to load the data.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-green-50 border-green-200">
        <Lightbulb className="h-5 w-5 text-green-600" />
        <AlertTitle>Sheet Selection</AlertTitle>
        <AlertDescription>
          You can only import one sheet at a time. If your data is spread across multiple sheets, you will need to import each one individually.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 