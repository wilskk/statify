import React from 'react';
import { HelpContentWrapper } from '../HelpContentWrapper';
import { ImportSav } from './ImportSav';
import { ImportCsv } from './ImportCsv';
import { ImportExcel } from './ImportExcel';
import { ImportClipboard } from './ImportClipboard';
import { ExportCsv } from './ExportCsv';
import { ExportExcel } from './ExportExcel';
import { ExampleDataset } from './ExampleDataset';
import { Print } from './Print';

type FileGuideProps = {
  section?: string;
};

export const FileGuide: React.FC<FileGuideProps> = ({ section }) => {
  const renderContent = () => {
    switch (section) {
      case 'import-sav':
        return <ImportSav />;
      case 'import-csv':
        return <ImportCsv />;
      case 'import-excel':
        return <ImportExcel />;
      case 'import-clipboard':
        return <ImportClipboard />;
      case 'export-csv':
        return <ExportCsv />;
      case 'export-excel':
        return <ExportExcel />;
      case 'example-data':
        return <ExampleDataset />;
      case 'print':
        return <Print />;
      default:
        return (
            <HelpContentWrapper
                title="File Management Guide"
                description="Select a topic from the sidebar to see the specific guide."
            >
              <></>
            </HelpContentWrapper>
        );
    }
  };

  return renderContent();
}; 