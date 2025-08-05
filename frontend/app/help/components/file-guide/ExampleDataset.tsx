/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Database, BookOpen, Lightbulb, FileText } from 'lucide-react';

export const ExampleDataset = () => {
  const sections = [
    {
      id: 'load-steps',
      title: 'Steps to Load Sample Dataset',
      description: 'Step-by-step guide to load sample datasets',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Open File Menu"
            description="Navigate to the 'File' menu in the main application toolbar."
          />
          <HelpStep
            number={2}
            title="Select Example Datasets"
            description="Click 'Example Datasets' to see the list of available datasets."
          />
          <HelpStep
            number={3}
            title="Select Dataset"
            description="Choose the dataset you want to use from the available list. Each dataset has a brief description of its contents."
          />
          <HelpStep
            number={4}
            title="Load Dataset"
            description="Click 'Load' to load the dataset into Statify's data editor."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Features & Benefits',
      description: 'Important information about sample datasets',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="No Internet Required">
            <p className="text-sm mt-2">
              All sample datasets are bundled with the application, so you can access them even when offline.
            </p>
          </HelpAlert>
          <HelpAlert variant="tip" title="Feature Exploration">
            <p className="text-sm mt-2">
              Sample datasets are specifically designed to help you explore various statistical analysis features in Statify.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Quick Learning',
      content: 'Use sample datasets to learn new features without needing to prepare your own data.'
    },
    {
      type: 'info' as const,
      title: 'Data Variety',
      content: 'Each sample dataset has different characteristics to demonstrate various types of analysis.'
    }
  ];

  const relatedTopics = [
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Import CSV Files', href: '/help/file-guide/import-csv' },
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Getting Started', href: '/help/getting-started' }
  ];

  return (
    <HelpGuideTemplate
      title="Using Sample Datasets"
      description="Statify provides various sample datasets to help you explore its features"
      category="File Management"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};