/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { FileSpreadsheet, Upload, Lightbulb, BookOpen, Database, Layers } from 'lucide-react';

export const ImportExcel = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'How to Import Excel Files',
      description: 'Step-by-step guide to bring your Excel data into Statify',
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
            title="Choose Excel Import"
            description="Select 'Open Excel File' from the dropdown options."
          />
          <HelpStep
            number={3}
            title="Select Your File"
            description="Browse your computer and choose the Excel file (.xlsx or .xls) you want to work with."
          />
          <HelpStep
            number={4}
            title="Pick Your Sheet"
            description="If your Excel file has multiple sheets, choose which one to import."
          />
          <HelpStep
            number={5}
            title="Load Your Data"
            description="Click 'Open' to bring your data into Statify's data editor."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Supported Formats',
      description: 'File types and features you can work with',
      icon: FileSpreadsheet,
      content: (
        <div className="space-y-4">
          <HelpCard title="File Types" icon={FileSpreadsheet} variant="feature">
            <ul className="text-sm space-y-1 mt-2">
              <li>• .xlsx (Excel 2007 and newer)</li>
              <li>• .xls (Excel 97-2003)</li>
            </ul>
          </HelpCard>
          
          <HelpCard title="Multiple Worksheets" icon={Layers} variant="feature">
            <p className="text-sm text-muted-foreground">
              Statify can handle Excel files with multiple worksheets and lets you choose which sheet to import.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Helpful Information',
      description: 'What you need to know about Excel files',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Did you know?">
            <p className="text-sm mt-2">
              Statify works perfectly with both .xlsx (Excel 2007+) and .xls (Excel 97-2003) formats.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Column Headers',
      content: 'Make sure your first row contains clear variable names for the best import results.'
    },
    {
      type: 'info' as const,
      title: 'Sheet Selection',
      content: 'For files with multiple worksheets, you can choose which sheet to import.'
    }
  ];

  const relatedTopics = [
    { title: 'Import CSV Files', href: '/help/file-guide/import-csv' },
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Export to Excel', href: '/help/file-guide/export-excel' },
    { title: 'Data Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Import Excel Files"
      description="Complete guide for bringing Excel data into Statify"

      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};