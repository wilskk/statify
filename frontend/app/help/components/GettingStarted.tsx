import React from "react";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert, HelpSection } from "../ui/HelpLayout";
import { 
  FileVideo, 
  Database, 
  BarChart, 
  LayoutDashboard, 
  Lightbulb, 
  CheckCircle2, 
  Play,
  BookOpen,
  Settings,
  TrendingUp
} from "lucide-react";

export const GettingStarted = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Welcome to Statify',
      description: 'A brief introduction to Statify',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p>
            Statify is a standalone statistical analysis tool that's fully compatible with SPSS. 
            No account creation or online registration required. Follow these steps to start using 
            Statify's advanced analytics.
          </p>
          
          <HelpAlert variant="success" title="Statify Advantages">
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fully compatible with SPSS (.sav) format</li>
              <li>No internet connection required</li>
              <li>Intuitive and easy-to-use interface</li>
              <li>Comprehensive statistical analysis</li>
            </ul>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'quick-start',
      title: 'Quick Start Steps',
      description: 'Step-by-step guide to get started',
      icon: Play,
      steps: [
        {
          title: 'Import Your Data',
          description: 'Start by importing your data file to Statify',
          content: (
            <div className="space-y-3">
              <p>
                Start by importing your SPSS (.sav) file or other supported data formats directly to Statify.
              </p>
              
              <HelpCard title="Supported Formats" variant="step">
                <ul className="text-sm space-y-1">
                  <li>• SPSS (.sav) - Primary format</li>
                  <li>• Excel (.xlsx, .xls)</li>
                  <li>• CSV (.csv)</li>
                  <li>• Clipboard data</li>
                </ul>
              </HelpCard>
            </div>
          )
        },
        {
          title: 'Explore the Dashboard',
          description: 'Get familiar with the interface and main features',
          content: (
            <div className="space-y-3">
              <p>
                After importing your data, explore the dashboard to understand the data structure and available features.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HelpCard title="Variable Panel" icon={Database}>
                  <p className="text-sm">View and manage all variables in your dataset</p>
                </HelpCard>
                
                <HelpCard title="Data View" icon={LayoutDashboard}>
                  <p className="text-sm">Display and edit data in table format</p>
                </HelpCard>
              </div>
            </div>
          )
        },
        {
          title: 'Start Analysis',
          description: 'Perform your first statistical analysis',
          content: (
            <div className="space-y-3">
              <p>
                Choose the type of analysis that suits your research needs.
              </p>
              
              <HelpCard title="Available Analysis" variant="feature">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <h5 className="font-semibold mb-1">Descriptive</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Frequencies</li>
                      <li>• Descriptives</li>
                      <li>• Explore</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Inferential</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• T-Tests</li>
                      <li>• ANOVA</li>
                      <li>• Regression</li>
                    </ul>
                  </div>
                </div>
              </HelpCard>
            </div>
          )
        }
      ]
    },
    {
      id: 'key-features',
      title: 'Key Features',
      description: 'Learn about important features in Statify',
      icon: TrendingUp,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HelpCard title="Import Data" icon={FileVideo} variant="feature">
            <p className="text-sm">
              Import various data formats easily and quickly.
            </p>
          </HelpCard>

          <HelpCard title="Data Management" icon={Database} variant="feature">
            <p className="text-sm">
              Manage and transform data with comprehensive tools.
            </p>
          </HelpCard>

          <HelpCard title="Statistical Analysis" icon={BarChart} variant="feature">
            <p className="text-sm">
              Perform various types of statistical analysis easily.
            </p>
          </HelpCard>

          <HelpCard title="Visualization" icon={TrendingUp} variant="feature">
            <p className="text-sm">
              Create informative and attractive charts and graphs.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Pro Tip',
      content: 'Start with a small dataset to understand Statify\'s workflow before using larger datasets.'
    },

  ];

  const relatedTopics = [
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Import Excel Files', href: '/help/file-guide/import-excel' },
    { title: 'Descriptive Statistics', href: '/help/statistics-guide/descriptive' },
    { title: 'Data Management', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Getting Started with Statify"
      description="Complete guide to start using Statify - a SPSS-compatible statistical analysis tool"
      category="Getting Started"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};