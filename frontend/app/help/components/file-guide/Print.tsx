/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Printer, FileText, Settings, Download, Image } from 'lucide-react';

export const Print = () => {
  const sections = [
    {
      id: 'print-steps',
      title: 'How to Print Your Data',
      description: 'Step-by-step guide to print data and analysis results',
      icon: Printer,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Open File Menu"
            description="Go to 'File' menu in the main toolbar."
          />
          <HelpStep
            number={2}
            title="Select Print"
            description="Choose 'Print' from the dropdown menu."
          />
          <HelpStep
            number={3}
            title="Choose Content"
            description="Select what you want to print (data view, analysis results, or charts)."
          />
          <HelpStep
            number={4}
            title="Set Up Print Settings"
            description="Adjust print settings like orientation and page size."
          />
          <HelpStep
            number={5}
            title="Print or Save"
            description="Click 'Print' to send to your printer or save as PDF."
          />
        </div>
      )
    },
    {
      id: 'print-options',
      title: 'Print Options',
      description: 'Different types of content you can print',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Data Tables" icon={FileText} variant="feature">
            <p className="text-sm text-muted-foreground">
              Print data tables with optimal formatting for easy reading.
            </p>
          </HelpCard>
          
          <HelpCard title="Statistical Output" icon={FileText} variant="feature">
            <p className="text-sm text-muted-foreground">
              Print statistical analysis results in professional format.
            </p>
          </HelpCard>
          
          <HelpCard title="Charts & Graphs" icon={Image} variant="feature">
            <p className="text-sm text-muted-foreground">
              Print charts and graphs in high resolution for presentations.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Print Quality',
      content: 'Use landscape orientation for wide data tables to make them easier to read.'
    },
    {
      type: 'info' as const,
      title: 'PDF Export',
      content: 'Save as PDF to share analysis results with colleagues or for archiving.'
    }
  ];

  const relatedTopics = [
    { title: 'Export to Excel', href: '/help/file-guide/export-excel' },
    { title: 'Export to CSV', href: '/help/file-guide/export-csv' },
    { title: 'Data Management Guide', href: '/help/data-guide' },
    { title: 'File Management Guide', href: '/help/file-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Print Your Data"
      description="Complete guide for printing data and analysis results from Statify"

      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};