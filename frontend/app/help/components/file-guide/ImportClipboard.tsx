/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ImportClipboard = () => {
  return (
    <HelpContentWrapper
      title="Importing from Clipboard"
      description="Learn how to paste data directly from your clipboard."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Steps to Import from Clipboard</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Copy your data from a spreadsheet application like Excel or Google Sheets.</li>
            <li>In Statify, go to "File" {'>'} "Import from Clipboard".</li>
            <li>The data will be automatically parsed and displayed in a preview.</li>
            <li>Confirm that the data appears correct and click "Import".</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-yellow-50 border-yellow-200">
        <Lightbulb className="h-5 w-5 text-yellow-600" />
        <AlertTitle>Formatting Tip</AlertTitle>
        <AlertDescription>
          For best results, ensure the data you copy has a consistent structure, with columns separated by tabs.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 