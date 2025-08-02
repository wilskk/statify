/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { FileSpreadsheet, Upload, Lightbulb, BookOpen, Database } from 'lucide-react';

export const ImportCsv = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'How to Import CSV Files',
      description: 'Step-by-step guide to bring your CSV data into Statify',
      icon: Upload,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Open File Menu"
            description="Click 'File' in the top menu bar of the application."
          />
          <HelpStep
            number={2}
            title="Choose CSV Import"
            description="Select 'Open CSV File' from the dropdown options."
          />
          <HelpStep
            number={3}
            title="Select Your File"
            description="Browse your computer and choose the CSV file you want to work with."
          />
          <HelpStep
            number={4}
            title="Load Your Data"
            description="Click 'Open' to bring your data into Statify's data editor."
          />
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Helpful Information',
      description: 'What you need to know about CSV files',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Did you know?">
            <p className="text-sm mt-2">
              CSV files are simple text files that work with almost all spreadsheet programs and statistical software.
            </p>
          </HelpAlert>
          
          <HelpCard title="About CSV Format" icon={FileSpreadsheet} variant="feature">
            <p className="text-sm text-muted-foreground">
              CSV stands for Comma-Separated Values. It uses commas to separate your data columns and new lines for each row of data.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'File Encoding',
      content: 'Use UTF-8 encoding for files with special characters or symbols.'
    },
    {
      type: 'info' as const,
      title: 'Data Separators',
      content: 'Statify automatically detects whether your file uses commas, semicolons, or tabs to separate data.'
    }
  ];

  const relatedTopics = [
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Import Excel Files', href: '/help/file-guide/import-excel' },
    { title: 'Export to CSV', href: '/help/file-guide/export-csv' },
    { title: 'Data Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Import CSV Files"
      description="Complete guide for bringing CSV data into Statify"
      category="File Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};