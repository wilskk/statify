/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Clipboard, Copy, Upload, Zap, Database } from 'lucide-react';

export const ImportClipboard = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'How to Import from Clipboard',
      description: 'Step-by-step guide to bring data directly from your clipboard',
      icon: Clipboard,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Copy Your Data"
            description="Copy data from any source (Excel, Google Sheets, etc.) using Ctrl+C."
          />
          <HelpStep
            number={2}
            title="Open File Menu"
            description="Go to 'File' menu in Statify."
          />
          <HelpStep
            number={3}
            title="Choose Clipboard Import"
            description="Select 'Import from Clipboard' from the dropdown."
          />
          <HelpStep
            number={4}
            title="Load Your Data"
            description="Your data will automatically load into the data editor."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Features & Benefits',
      description: 'Why clipboard import is so useful',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Quick Import">
            <p className="text-sm mt-2">
              This is the fastest way to get data into Statify. Just copy from any spreadsheet and paste directly.
            </p>
          </HelpAlert>
          
          <HelpCard title="Universal Support" icon={Copy} variant="feature">
            <p className="text-sm text-muted-foreground">
              Works with data from Excel, Google Sheets, LibreOffice Calc, and other spreadsheet applications.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Data Format',
      content: 'Make sure your data has headers in the first row for the best import results.'
    },
    {
      type: 'info' as const,
      title: 'Auto Detection',
      content: 'Statify automatically detects data format and column types when importing from clipboard.'
    }
  ];

  const relatedTopics = [
    { title: 'Import CSV Files', href: '/help/file-guide/import-csv' },
    { title: 'Import Excel Files', href: '/help/file-guide/import-excel' },
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Data Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Import from Clipboard"
      description="Complete guide for bringing data directly from your clipboard into Statify"
      category="File Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};