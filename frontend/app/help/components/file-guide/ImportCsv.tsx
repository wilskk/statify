/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ImportCsv = () => {
  return (
    <HelpContentWrapper
      title="Importing CSV Files"
      description="This guide explains how to import data from a Comma-Separated Values (.csv) file."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Steps to Import a .csv File</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to the "File" menu and select "Import from CSV".</li>
            <li>In the dialog, click "Choose File" to select your .csv file.</li>
            <li>Adjust the import settings like delimiter and decimal separator if needed.</li>
            <li>Click "Import" to load the data.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-blue-50 border-blue-200">
        <Lightbulb className="h-5 w-5 text-blue-600" />
        <AlertTitle>Pro Tip</AlertTitle>
        <AlertDescription>
          Ensure your CSV file is well-formatted. The first row should ideally contain the variable names.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 