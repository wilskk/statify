import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, Table } from 'lucide-react';

// Tab content components for better organization
const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What is Frequency Analysis?">
      <p className="text-sm mt-2">
        Frequency analysis counts how often each unique value appears in your data. 
        This helps you understand the distribution of values and identify patterns.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Frequency Analysis" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Understanding categorical data distribution</li>
        <li>• Identifying the most common values</li>
        <li>• Checking data quality and missing values</li>
        <li>• Preparing data for further analysis</li>
      </ul>
    </HelpCard>

    <HelpCard title="What You'll Learn" icon={FileText} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• How to select variables for analysis</li>
        <li>• Available statistics options</li>
        <li>• Chart customization options</li>
        <li>• How to interpret results</li>
      </ul>
    </HelpCard>
  </div>
);

const VariablesTab = () => (
  <div className="space-y-6">
    <HelpCard title="Selecting Variables" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Choose Your Variables"
          description="Select one or more variables from the available variables list. These can be categorical or numerical variables."
        />
        <HelpStep
          number={2}
          title="Drag to Selected"
          description="Drag variables from the available list to the selected variables box, or use the arrow buttons to move them."
        />
        <HelpStep
          number={3}
          title="Reorder if Needed"
          description="Use the up/down arrows to change the order of variables if you're analyzing multiple variables."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Variable Types">
      <p className="text-sm mt-2">
        Frequency analysis works best with categorical variables (nominal or ordinal), 
        but can also be used with numerical data to see value distributions.
      </p>
    </HelpAlert>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Available Statistics" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Central Tendency"
          description="Choose mean, median, mode, and sum as measures of central tendency."
        />
        <HelpStep
          number={2}
          title="Dispersion"
          description="Select standard deviation, variance, range, minimum, and maximum."
        />
        <HelpStep
          number={3}
          title="Percentile Values"
          description="Add quartiles, cut points for equal groups, or custom percentiles."
        />
        <HelpStep
          number={4}
          title="Distribution"
          description="Include skewness and kurtosis to understand distribution shape."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Statistics Options">
      <p className="text-sm mt-2">
        You can choose which statistics to display based on your analysis needs. 
        Not all statistics are relevant for all types of data.
      </p>
    </HelpAlert>
  </div>
);

const ChartsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Chart Options" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Chart Types"
          description="Choose from bar charts, pie charts, or histograms to visualize your frequency data."
        />
        <HelpStep
          number={2}
          title="Customization"
          description="Adjust colors, labels, and axis settings to make your charts clear and professional."
        />
        <HelpStep
          number={3}
          title="Display Options"
          description="Control whether to show frequency tables, charts, or both in your results."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Chart Best Practices">
      <p className="text-sm mt-2">
        Bar charts work well for most frequency data, while pie charts are best for 
        showing proportions of a whole. Choose based on your data story.
      </p>
    </HelpAlert>
  </div>
);

const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Quick Start" icon={FileText} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Ready to create your first frequency table?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Select your variables in the Variables tab</li>
          <li>Choose your statistics in the Statistics tab</li>
          <li>Customize your charts in the Charts tab</li>
          <li>Click OK to generate your frequency analysis</li>
        </ol>
      </div>
    </HelpCard>

    <HelpCard title="Related Topics" icon={FileText} variant="feature">
      <div className="space-y-2">
        <p className="text-sm">Learn more about:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Descriptive Statistics for more advanced analysis</li>
          <li>Cross Tabulation for relationship analysis</li>
          <li>Data Exploration for comprehensive data understanding</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

export const Frequencies: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: HelpCircle },
    { value: 'variables', label: 'Variables', icon: Table },
    { value: 'statistics', label: 'Statistics', icon: Calculator },
    { value: 'charts', label: 'Charts', icon: BarChart3 }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Frequency Analysis Guide</h1>
        <p className="text-muted-foreground">
          Learn how to create and interpret frequency tables for your data
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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

        <TabsContent value="charts" className="mt-6">
          <ChartsTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

