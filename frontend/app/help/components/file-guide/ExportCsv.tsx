/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Download, FileSpreadsheet, Lightbulb, Settings } from 'lucide-react';

export const ExportCsv = () => {
  const sections = [
    {
      id: 'export-steps',
      title: 'How to Export to CSV',
      description: 'Step-by-step guide to save your data as a CSV file',
      icon: Download,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Check Your Data"
            description="Make sure the data you want to export is loaded in the data editor."
          />
          <HelpStep
            number={2}
            title="Open File Menu"
            description="Go to 'File' menu and select 'Export to CSV'."
          />
          <HelpStep
            number={3}
            title="Choose Your Settings"
            description="A dialog will appear where you can set options like separators and decimal symbols."
          />
          <HelpStep
            number={4}
            title="Name Your File"
            description="Enter a file name and choose where to save it on your computer."
          />
          <HelpStep
            number={5}
            title="Save Your Data"
            description="Click 'Export' to save the file to your computer."
          />
        </div>
      )
    },
    {
      id: 'options',
      title: 'Export Options',
      description: 'Settings you can adjust when saving your file',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Data Separators">
            <p className="text-sm mt-2">
              Choose how to separate your data columns (comma, semicolon, or tab) based on what works best for your needs.
            </p>
          </HelpAlert>
          <HelpAlert variant="tip" title="Decimal Symbols">
            <p className="text-sm mt-2">
              Set decimal symbols (period or comma) to match your regional standards or the requirements of other software.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'warning' as const,
      title: 'Data Notes',
      content: 'CSV export saves your raw data only. Variable properties like labels or measurement levels won\'t be included in the .csv file.'
    },
    {
      type: 'tip' as const,
      title: 'Compatibility',
      content: 'CSV files work with almost all spreadsheet programs and other statistical software.'
    },
    {
      type: 'info' as const,
      title: 'Character Support',
      content: 'CSV files are saved with UTF-8 encoding to ensure special characters display correctly.'
    }
  ];

  const relatedTopics = [
    { title: 'Export to Excel', href: '/help/file-guide/export-excel' },
    { title: 'Import CSV Files', href: '/help/file-guide/import-csv' },
    { title: 'Print Your Data', href: '/help/file-guide/print' },
    { title: 'Data Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Export to CSV"
      description="Complete guide for saving your data as Comma-Separated Values (.csv)"
      category="File Management"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};