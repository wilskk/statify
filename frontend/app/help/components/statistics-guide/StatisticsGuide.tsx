import React from 'react';
import { Crosstabs } from './crosstabs';
import { DescriptiveAnalysis } from './descriptive/DescriptiveAnalysis';
import { Explore } from './explore';
import { Frequencies } from './frequencies';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, BarChart, LineChart, PieChart } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';

type StatisticsGuideProps = {
  section?: string;
};

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({ section }) => {
  const renderContent = () => {
    switch (section) {
      case 'frequencies':
        return <Frequencies />;
      case 'descriptives':
        return <DescriptiveAnalysis />;
      case 'explore':
        return <Explore />;
      case 'crosstabs':
        return <Crosstabs />;
      default:
        return (
          <HelpContentWrapper
            title="Statistics Guide"
            description="Comprehensive guides to understand and interpret the various statistical analyses available in Statify."
          >
            <Alert className="my-6 bg-blue-50 border-blue-100 text-blue-800">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <AlertTitle className="text-blue-800 font-medium mb-1">Getting Started with Statistical Analysis</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Select a topic from the sidebar to view detailed guides on specific statistical methods.
                    Each guide includes examples, interpretations, and best practices.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <BarChart className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-medium mb-1">Descriptive Statistics</h3>
                  <p className="text-sm text-muted-foreground">
                    Summarize and visualize your data's main characteristics
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <LineChart className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-medium mb-1">Inferential Statistics</h3>
                  <p className="text-sm text-muted-foreground">
                    Make predictions and test hypotheses about a population
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <PieChart className="h-10 w-10 text-primary mb-2" />
                  <h3 className="font-medium mb-1">Advanced Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore complex relationships and patterns in your data
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="prose max-w-none mt-8">
              <h3>How to Use This Guide</h3>
              <p>
                This Statistics Guide is designed to help both beginners and experienced users make the most of Statify's 
                analytical capabilities. Each section provides:
              </p>
              <ul>
                <li>Step-by-step instructions for running analyses</li>
                <li>Explanation of key concepts and terminology</li>
                <li>Guidelines for interpreting results</li>
                <li>Examples using sample datasets</li>
                <li>Common pitfalls to avoid</li>
              </ul>
            </div>
          </HelpContentWrapper>
        );
    }
  };

  return renderContent();
}; 