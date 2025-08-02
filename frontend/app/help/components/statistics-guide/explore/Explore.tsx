import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, Settings, TrendingUp } from 'lucide-react';

// Tab content components for data exploration
const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What is Data Exploration?">
      <p className="text-sm mt-2">
        Data exploration provides comprehensive insights into your data using robust statistical methods. 
        It identifies patterns, outliers, and distribution characteristics while providing reliable estimates 
        that aren't affected by extreme values.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Data Exploration" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Initial data analysis and understanding</li>
        <li>• Outlier detection and data quality assessment</li>
        <li>• Distribution analysis and normality checking</li>
        <li>• Robust statistical estimation</li>
        <li>• Data pattern identification</li>
      </ul>
    </HelpCard>

    <HelpCard title="What You'll Get" icon={FileText} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Descriptive statistics with robust estimates</li>
        <li>• 5% trimmed mean for outlier-resistant central tendency</li>
        <li>• Percentiles from 5th to 95th</li>
        <li>• Outlier detection and extreme value identification</li>
        <li>• Distribution shape analysis</li>
        <li>• Clear visual presentation of results</li>
      </ul>
    </HelpCard>
  </div>
);

const VariablesTab = () => (
  <div className="space-y-6">
    <HelpCard title="Selecting Variables for Analysis" icon={TrendingUp} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Choose Numerical Variables"
          description="Select one or more numerical variables to analyze. These should be continuous or interval variables."
        />
        <HelpStep
          number={2}
          title="Check Data Quality"
          description="Review your variables for missing values, outliers, or data entry errors before analysis."
        />
        <HelpStep
          number={3}
          title="Consider Variable Types"
          description="Ensure variables are appropriate for robust statistical analysis (scale/interval level)."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Variable Selection Tips">
      <p className="text-sm mt-2">
        Choose variables that represent meaningful measurements in your dataset. 
        Data exploration works best with numerical variables that have sufficient variation.
      </p>
    </HelpAlert>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Robust Descriptive Statistics" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Central tendency measures:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Mean</strong> - Arithmetic average of all values</li>
          <li>• <strong>5% Trimmed Mean</strong> - Mean excluding top/bottom 5% of values</li>
          <li>• <strong>Median</strong> - Middle value when sorted</li>
          <li>• <strong>Mode</strong> - Most frequently occurring value</li>
        </ul>
      </div>
    </HelpCard>

    <HelpCard title="Distribution Measures" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Spread and shape statistics:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Standard deviation</strong> - Measure of data spread</li>
          <li>• <strong>Range</strong> - Difference between max and min values</li>
          <li>• <strong>Interquartile range (IQR)</strong> - Range of middle 50%</li>
          <li>• <strong>Skewness</strong> - Measure of distribution asymmetry</li>
          <li>• <strong>Kurtosis</strong> - Measure of distribution tail heaviness</li>
        </ul>
      </div>
    </HelpCard>

    <HelpCard title="Percentiles" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Distribution position measures:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>5th to 95th percentiles</strong> - Full distribution coverage</li>
          <li>• <strong>Quartiles</strong> - 25th, 50th (median), and 75th percentiles</li>
          <li>• <strong>Deciles</strong> - 10 equal divisions of the distribution</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

const PlotsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Outlier Detection Methods" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Box Plot Analysis"
          description="Identify outliers using the IQR method: values beyond Q1-1.5×IQR or Q3+1.5×IQR."
        />
        <HelpStep
          number={2}
          title="Z-Score Method"
          description="Flag values with z-scores beyond ±3 standard deviations from the mean."
        />
        <HelpStep
          number={3}
          title="Percentile Method"
          description="Identify values beyond the 5th and 95th percentiles as potential outliers."
        />
      </div>
    </HelpCard>

    <HelpCard title="Distribution Visualization" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Histogram Analysis"
          description="Visualize the shape of your data distribution and identify unusual patterns."
        />
        <HelpStep
          number={2}
          title="Box Plot Interpretation"
          description="Understand the spread, central tendency, and outliers in your data."
        />
        <HelpStep
          number={3}
          title="Q-Q Plot Analysis"
          description="Assess whether your data follows a normal distribution pattern."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Outlier Interpretation">
      <p className="text-sm mt-2">
        Outliers aren't necessarily errors - they may represent important phenomena in your data. 
        Always investigate the context before deciding to remove or transform them.
      </p>
    </HelpAlert>
  </div>
);

const OptionsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Analysis Options" icon={Settings} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Missing Value Handling"
          description="Choose how to handle missing data - listwise deletion or pairwise analysis."
        />
        <HelpStep
          number={2}
          title="Outlier Treatment"
          description="Decide whether to identify, flag, or exclude outliers from analysis."
        />
        <HelpStep
          number={3}
          title="Rounding Precision"
          description="Set decimal places for displaying statistics and results."
        />
        <HelpStep
          number={4}
          title="Display Format"
          description="Choose how to present results - compact vs detailed format."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Analysis Best Practices">
      <p className="text-sm mt-2">
        Always document your analysis choices and consider the impact of outlier treatment 
        on your final results. Robust methods provide more reliable estimates.
      </p>
    </HelpAlert>
  </div>
);

const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Quick Start" icon={FileText} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Ready to explore your data?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Select variables in the Variables tab</li>
          <li>Review statistics in the Statistics tab</li>
          <li>Configure plots in the Plots tab</li>
          <li>Set options in the Options tab</li>
          <li>Click OK to generate your exploration</li>
        </ol>
      </div>
    </HelpCard>

    <HelpCard title="Interpreting Results" icon={FileText} variant="feature">
      <div className="space-y-2">
        <p className="text-sm">Key insights to look for:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Distribution shape and normality</li>
          <li>Presence of outliers or extreme values</li>
          <li>Robust central tendency estimates</li>
          <li>Data quality indicators and patterns</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

export const Explore: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: HelpCircle },
    { value: 'variables', label: 'Variables', icon: TrendingUp },
    { value: 'statistics', label: 'Statistics', icon: Calculator },
    { value: 'plots', label: 'Plots', icon: BarChart3 },
    { value: 'options', label: 'Options', icon: Settings }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Data Exploration Guide</h1>
        <p className="text-muted-foreground">
          Learn how to perform comprehensive data exploration with robust statistics and outlier detection
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="variables" className="mt-6">
          <VariablesTab />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab />
        </TabsContent>

        <TabsContent value="plots" className="mt-6">
          <PlotsTab />
        </TabsContent>

        <TabsContent value="options" className="mt-6">
          <OptionsTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};
