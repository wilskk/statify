/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export const ExampleDataset = () => {
  return (
    <HelpContentWrapper
      title="Using Example Datasets"
      description="Statify includes a variety of sample datasets for you to explore its features."
    >
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">How to Load an Example Dataset</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to "File" {'>'} "Example Datasets".</li>
            <li>A dialog will open showcasing the available datasets.</li>
            <li>Each dataset has a brief description of its contents.</li>
            <li>Click on a dataset card to load it directly into the data editor.</li>
          </ol>
        </CardContent>
      </Card>
      <Alert variant="default" className="mt-6 bg-purple-50 border-purple-200">
        <Lightbulb className="h-5 w-5 text-purple-600" />
        <AlertTitle>No Internet Required</AlertTitle>
        <AlertDescription>
          All example datasets are bundled with the application, so you can access them even when you are offline.
        </AlertDescription>
      </Alert>
    </HelpContentWrapper>
  );
}; 