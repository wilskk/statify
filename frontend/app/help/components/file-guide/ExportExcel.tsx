/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ExportExcel = () => {
  return (
    <HelpContentWrapper
      title="Exporting to Excel"
      description="This guide explains how to save your data as a Microsoft Excel (.xlsx) file."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Steps to Export to an Excel File</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>With your data loaded, go to "File" {'>'} "Export to Excel".</li>
            <li>In the export dialog, provide a name for your file.</li>
            <li>You can choose to include variable value labels if desired.</li>
            <li>Click "Export" to generate and download the .xlsx file.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-green-50 border-green-200">
        <Lightbulb className="h-5 w-5 text-green-600" />
        <AlertTitle>Value Labels</AlertTitle>
        <AlertDescription>
          Unlike CSV, exporting to Excel allows you to preserve value labels. This means that if you have a variable where 1="Male" and 2="Female", the exported file can contain "Male" and "Female" instead of 1 and 2.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 