/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ImportSav = () => {
  return (
    <HelpContentWrapper
      title="Importing .sav Files"
      description="This guide explains how to import data from SPSS (.sav) files into Statify."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Steps to Import a .sav File</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Navigate to the "File" menu in the main application toolbar.</li>
            <li>Select "Open .sav File" from the dropdown menu.</li>
            <li>A file dialog will appear. Locate and select your .sav file.</li>
            <li>Click "Open" to load the data into the data editor.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-blue-50 border-blue-200">
        <Lightbulb className="h-5 w-5 text-blue-600" />
        <AlertTitle>Did you know?</AlertTitle>
        <AlertDescription>
          Statify can handle large .sav files efficiently, but for very large datasets, the import process might take a few moments.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 