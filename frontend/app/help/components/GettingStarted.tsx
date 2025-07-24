import React from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileVideo, Database, BarChart, Bell, LayoutDashboard, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpContentWrapper } from "./HelpContentWrapper";

export const GettingStarted = () => {
  return (
    <HelpContentWrapper
      title="Getting Started with Statify"
      description="Statify is a standalone SPSS-compatible statistical analysis tool that requires no account creation or online registration. Follow these steps to start using Statify's advanced analytics:"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                <FileVideo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-1 text-base">Import Your Data</CardTitle>
                <CardDescription className="text-sm">Start by importing your SPSS (.sav) files or other supported data formats directly into Statify.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-1 text-base">Connect Your Data</CardTitle>
                <CardDescription className="text-sm">Connect your data sources using our integration wizard.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-1 text-base">Explore the Dashboard</CardTitle>
                <CardDescription className="text-sm">View insights from your personalized dashboard.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-1 text-base">Set Up Notifications</CardTitle>
                <CardDescription className="text-sm">Configure alerts and notifications for your key metrics.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900 py-3 px-4">
        <div className="flex items-start">
          <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-amber-800 text-sm font-medium mb-1">Pro Tip</AlertTitle>
            <AlertDescription className="text-amber-700">
              Try our sample datasets to explore Statify&apos;s features before importing your own data.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
          Getting Started Checklist
        </h3>
        
        <div className="space-y-2 pl-8 mb-6">
          {['Import your first dataset', 'View data in the data editor', 'Run your first analysis', 'Create your first chart'].map((item, i) => (
            <div key={i} className="flex items-center text-sm">
              <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center mr-3 text-xs font-medium">{i+1}</span>
              {item}
            </div>
          ))}
        </div>
        
        <Button variant="default" className="mt-2">
          <FileVideo className="h-4 w-4 mr-2" />
          Watch Tutorial Video
        </Button>
      </div>
    </HelpContentWrapper>
  );
}; 