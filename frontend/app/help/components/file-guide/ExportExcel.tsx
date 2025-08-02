/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Download, FileSpreadsheet, Lightbulb, Settings, Tags } from 'lucide-react';

export const ExportExcel = () => {
  const sections = [
    {
      id: 'export-steps',
      title: 'How to Export to Excel',
      description: 'Step-by-step guide to save your data as an Excel file',
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
            description="Go to 'File' menu and select 'Export to Excel'."
          />
          <HelpStep
            number={3}
            title="Set Up Export"
            description="An export dialog will appear. Give your file a name."
          />
          <HelpStep
            number={4}
            title="Choose Value Labels"
            description="You can choose to include variable value labels if you want."
          />
          <HelpStep
            number={5}
            title="Create Your File"
            description="Click 'Export' to create and download your .xlsx file."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Features & Benefits',
      description: 'Advantages of exporting to Excel format',
      icon: Tags,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="success" title="Value Labels">
            <p className="text-sm mt-2">
              Unlike CSV, Excel export lets you keep value labels. This means if you have a variable with 1="Male" and 2="Female", your exported file can show "Male" and "Female" instead of 1 and 2.
            </p>
          </HelpAlert>
          <HelpAlert variant="info" title="Format Preservation">
            <p className="text-sm mt-2">
              Excel format keeps more metadata information compared to CSV, including data types and formatting.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'options',
      title: 'Export Options',
      description: 'Settings you can customize',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="tip" title="Multiple Worksheets">
            <p className="text-sm mt-2">
              Excel files can contain multiple worksheets, allowing better organization for complex datasets.
            </p>
          </HelpAlert>
          <HelpAlert variant="info" title="Compatibility">
            <p className="text-sm mt-2">
              .xlsx files work with Microsoft Excel, LibreOffice Calc, Google Sheets, and other spreadsheet applications.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'success' as const,
      title: 'Metadata Preservation',
      content: 'Excel export keeps more metadata information than other formats, including value labels and formatting.'
    },
    {
      type: 'tip' as const,
      title: 'File Size',
      content: 'Excel files are generally larger than CSV, but they store more structural information and metadata.'
    },
    {
      type: 'info' as const,
      title: 'Cross-Platform',
      content: '.xlsx format works across different platforms and modern spreadsheet applications.'
    }
  ];

  const relatedTopics = [
    { title: 'Export to CSV', href: '/help/file-guide/export-csv' },
    { title: 'Import Excel Files', href: '/help/file-guide/import-excel' },
    { title: 'Print Your Data', href: '/help/file-guide/print' },
    { title: 'Data Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Export to Excel"
      description="Complete guide for saving your data as Microsoft Excel (.xlsx)"
      category="File Management"
      lastUpdated="2024-01-15"

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};