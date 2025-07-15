import React from 'react';
import { Crosstabs } from './crosstabs';
import { DescriptiveAnalysis } from './descriptive/DescriptiveAnalysis';
import { Explore } from './explore';
import { Frequencies } from './frequencies';
// Removed HelpContentWrapper and related UI imports since the component now defaults to the Frequencies guide

type StatisticsGuideProps = {
  section?: string;
};

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({ section }) => {
  const renderContent = () => {
    // When no specific sub-section is provided, default to Frequencies guide
    if (!section) {
      return <Frequencies />;
    }

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
        // Fallback to Frequencies as well for any unmatched keys
        return <Frequencies />;
    }
  };

  return renderContent();
}; 