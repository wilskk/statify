/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { FileText, Upload, Lightbulb, BookOpen, Database } from 'lucide-react';

export const ImportSav = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'How to Import SPSS Files',
      description: 'Step-by-step guide to bring your SPSS data into Statify',
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
            title="Choose SPSS Import"
            description="Select 'Open .sav File' from the dropdown options."
          />
          <HelpStep
            number={3}
            title="Select Your File"
            description="Browse your computer and choose the .sav file you want to work with."
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
      description: 'What you need to know about SPSS files',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Did you know?">
            <p className="text-sm mt-2">
              Statify can efficiently handle large .sav files. For very large datasets, the import process might take a few moments.
            </p>
          </HelpAlert>
          
          <HelpCard title="Supported Formats" icon={Database} variant="feature">
            <p className="text-sm text-muted-foreground">
              Statify supports SPSS files (.sav) from various versions, including files created with the latest SPSS.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Large Files',
      content: 'For large files (over 10MB), make sure your browser has enough memory available.'
    },
    {
      type: 'warning' as const,
      title: 'Compatibility',
      content: 'Some very specific SPSS features may not be fully supported.'
    }
  ];

  const relatedTopics = [
    { title: 'Import CSV Files', href: '/help/file-guide/import-csv' },
    { title: 'Import Excel Files', href: '/help/file-guide/import-excel' },
    { title: 'Export Your Data', href: '/help/file-guide/export-csv' },
    { title: 'Data Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Import SPSS Files"
      description="Complete guide for bringing SPSS data (.sav) into Statify"

      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};