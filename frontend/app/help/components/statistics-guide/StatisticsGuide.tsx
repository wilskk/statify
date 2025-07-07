import React from 'react';
import { Crosstabs } from './descriptive/Crosstabs';
import { DescriptiveAnalysis } from './descriptive/DescriptiveAnalysis';
import { Explore } from './descriptive/Explore';
import { Frequencies } from './descriptive/Frequencies';

type StatisticsGuideProps = {
  section?: string;
};

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({ section }) => {
  const renderContent = () => {
    switch (section) {
      case 'frequencies':
        return <Frequencies />;
      case 'descriptives':
        return <DescriptiveAnalysis />;
      case 'explore':
        return <Explore />;
      case 'crosstabs':
        return <Crosstabs />;
      default:
        return (
          <div className="prose max-w-none">
            <h2>Panduan Statistik</h2>
            <p>Pilih topik dari submenu untuk melihat panduan analisis statistik yang spesifik.</p>
            <p>Panduan ini akan membantu Anda memahami dan menginterpretasikan berbagai jenis analisis statistik yang tersedia di Statify.</p>
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
}; 