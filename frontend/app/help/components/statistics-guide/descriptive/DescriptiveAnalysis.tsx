import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, TrendingUp, Table, Settings } from 'lucide-react';

// Tab content components for descriptive statistics
const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What are Descriptive Statistics?">
      <p className="text-sm mt-2">
        Descriptive statistics summarize your data with key measures like average, spread, 
        and distribution shape. They give you quick insights about your data's characteristics.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Descriptive Statistics" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Understanding your data's central tendency</li>
        <li>• Measuring how spread out your data is</li>
        <li>• Checking data quality and outliers</li>
        <li>• Comparing different variables or groups</li>
      </ul>
    </HelpCard>

    <HelpCard title="Key Statistics You'll Get" icon={Calculator} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Mean, median, and mode (central tendency)</li>
        <li>• Standard deviation and variance (spread)</li>
        <li>• Minimum and maximum values (range)</li>
        <li>• Skewness and kurtosis (distribution shape)</li>
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
          title="Choose Variables"
          description="Select one or more numerical variables from your dataset. Descriptive statistics work best with continuous data."
        />
        <HelpStep
          number={2}
          title="Add to Analysis"
          description="Drag variables to the analysis box or use arrow buttons to add them to your descriptive analysis."
        />
        <HelpStep
          number={3}
          title="Review Selection"
          description="Ensure all selected variables are appropriate for numerical analysis."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Variable Requirements">
      <p className="text-sm mt-2">
        Descriptive statistics require numerical variables. Categorical variables 
        should use frequency analysis instead.
      </p>
    </HelpAlert>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Central Tendency" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Available measures:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Mean</strong> - The average of all values</li>
          <li>• <strong>Median</strong> - The middle value when sorted</li>
          <li>• <strong>Mode</strong> - The most frequent value</li>
          <li>• <strong>Sum</strong> - Total of all values</li>
        </ul>
      </div>
    </HelpCard>

    <HelpCard title="Dispersion" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Available measures:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Standard Deviation</strong> - Average distance from mean</li>
          <li>• <strong>Variance</strong> - Squared average distance from mean</li>
          <li>• <strong>Range</strong> - Difference between max and min</li>
          <li>• <strong>Minimum & Maximum</strong> - Smallest and largest values</li>
        </ul>
      </div>
    </HelpCard>

    <HelpCard title="Distribution Shape" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Available measures:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Skewness</strong> - Measure of asymmetry</li>
          <li>• <strong>Kurtosis</strong> - Measure of tail heaviness</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

const ChartsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Chart Options" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Histograms"
          description="Visualize the distribution of your data with frequency histograms."
        />
        <HelpStep
          number={2}
          title="Box Plots"
          description="Show the median, quartiles, and outliers in your data."
        />
        <HelpStep
          number={3}
          title="Stem-and-Leaf Plots"
          description="Display actual data values while showing distribution shape."
        />
        <HelpStep
          number={4}
          title="Normal Q-Q Plots"
          description="Check if your data follows a normal distribution."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Chart Selection">
      <p className="text-sm mt-2">
        Choose charts based on your analysis goals. Histograms show distribution shape, 
        while box plots highlight outliers and quartiles.
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
          title="Display Order"
          description="Choose how to sort your variables in the output."
        />
        <HelpStep
          number={2}
          title="Statistics Display"
          description="Select which statistics to show in your results."
        />
        <HelpStep
          number={3}
          title="Save Options"
          description="Choose to save standardized values or other derived data."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Customization">
      <p className="text-sm mt-2">
        You can customize the analysis to focus on specific statistics or display options 
        based on your needs.
      </p>
    </HelpAlert>
  </div>
);

const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Quick Start" icon={FileText} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Ready to analyze your data?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Select numerical variables in the Variables tab</li>
          <li>Choose statistics in the Statistics tab</li>
          <li>Customize charts in the Charts tab</li>
          <li>Set options in the Options tab</li>
          <li>Click OK to generate your descriptive analysis</li>
        </ol>
      </div>
    </HelpCard>

    <HelpCard title="Interpreting Results" icon={FileText} variant="feature">
      <div className="space-y-2">
        <p className="text-sm">Key insights to look for:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Mean indicates your data's central tendency</li>
          <li>Standard deviation shows data spread</li>
          <li>Skewness reveals distribution asymmetry</li>
          <li>Outliers appear in box plots and histograms</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

export const DescriptiveAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: HelpCircle },
    { value: 'variables', label: 'Variables', icon: Table },
    { value: 'statistics', label: 'Statistics', icon: Calculator },
    { value: 'charts', label: 'Charts', icon: BarChart3 },
    { value: 'options', label: 'Options', icon: Settings }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Descriptive Statistics Guide</h1>
        <p className="text-muted-foreground">
          Learn how to calculate and interpret summary statistics for your data
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

        <TabsContent value="charts" className="mt-6">
          <ChartsTab />
        </TabsContent>

        <TabsContent value="options" className="mt-6">
          <OptionsTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};
