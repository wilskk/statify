import React from 'react';
import { Crosstabs } from './crosstabs';
import { DescriptiveAnalysis } from './descriptive/DescriptiveAnalysis';
import { Explore } from './explore';
import { Frequencies } from './frequencies';
import { 
  Autocorrelation, 
  BoxJenkinsModel,
  Decomposition,
  Smoothing,
  UnitRootTest
} from './time-series';
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
      case 'autocorrelation':
        return <Autocorrelation />;
      case 'box-jenkins-model':
        return <BoxJenkinsModel />;
      case 'decomposition':
        return <Decomposition />;
      case 'smoothing':
        return <Smoothing />;
      case 'unit-root-test':
        return <UnitRootTest />;
      default:
        // Fallback to Frequencies as well for any unmatched keys
        return <Frequencies />;
    }
  };

  return renderContent();
}; 