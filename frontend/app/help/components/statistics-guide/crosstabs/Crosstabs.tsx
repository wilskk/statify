import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, Table, Settings } from 'lucide-react';

// Tab content components for cross tabulation analysis
const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What is Cross Tabulation?">
      <p className="text-sm mt-2">
        Cross tabulation examines relationships between two categorical variables by creating a contingency table. 
        It shows how frequencies are distributed across categories and tests for statistical significance.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Cross Tabulation" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Testing relationships between categorical variables</li>
        <li>• Analyzing survey responses by demographic groups</li>
        <li>• Comparing proportions across different categories</li>
        <li>• Identifying patterns in categorical data</li>
      </ul>
    </HelpCard>

    <HelpCard title="What You'll Get" icon={FileText} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Contingency table with observed and expected counts</li>
        <li>• Chi-Square test for independence</li>
        <li>• Row and column percentages</li>
        <li>• Measures of association (Cramer's V, Gamma, etc.)</li>
        <li>• Residual analysis for cell significance</li>
      </ul>
    </HelpCard>
  </div>
);

const VariablesTab = () => (
  <div className="space-y-6">
    <HelpCard title="Selecting Row and Column Variables" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Choose Row Variable"
          description="Select your first categorical variable to appear as rows in the contingency table."
        />
        <HelpStep
          number={2}
          title="Choose Column Variable"
          description="Select your second categorical variable to appear as columns in the contingency table."
        />
        <HelpStep
          number={3}
          title="Check Variable Types"
          description="Ensure both variables are categorical (nominal or ordinal) for valid cross-tabulation."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Variable Selection Tips">
      <p className="text-sm mt-2">
        Choose variables that make logical sense to compare. The row variable is often your outcome 
        or dependent variable, while the column variable is typically your predictor or independent variable.
      </p>
    </HelpAlert>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Chi-Square Test" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Tests the null hypothesis that variables are independent:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Chi-Square statistic</strong> - Overall test of independence</li>
          <li>• <strong>Degrees of freedom</strong> - (rows-1) × (columns-1)</li>
          <li>• <strong>P-value</strong> - Probability of observing these results by chance</li>
          <li>• <strong>Expected frequencies</strong> - Counts expected under independence</li>
        </ul>
      </div>
    </HelpCard>

    <HelpCard title="Measures of Association" icon={Calculator} variant="feature">
      <div className="space-y-3 mt-2">
        <p className="text-sm font-medium">Strength of relationship between variables:</p>
        <ul className="text-sm space-y-1 ml-4">
          <li>• <strong>Cramer's V</strong> - Overall strength (0 to 1)</li>
          <li>• <strong>Phi coefficient</strong> - For 2×2 tables only</li>
          <li>• <strong>Contingency coefficient</strong> - Adjusted for table size</li>
          <li>• <strong>Lambda</strong> - Proportional reduction in error</li>
        </ul>
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Interpreting Results">
      <p className="text-sm mt-2">
        A significant Chi-Square result (p &lt; 0.05) suggests the variables are related. 
        Association measures indicate the strength of this relationship.
      </p>
    </HelpAlert>
  </div>
);

const CellsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Cell Display Options" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Observed Counts"
          description="Show actual frequencies in each cell of the contingency table."
        />
        <HelpStep
          number={2}
          title="Expected Counts"
          description="Display expected frequencies assuming variables are independent."
        />
        <HelpStep
          number={3}
          title="Row Percentages"
          description="Show what percentage each cell represents of its row total."
        />
        <HelpStep
          number={4}
          title="Column Percentages"
          description="Show what percentage each cell represents of its column total."
        />
        <HelpStep
          number={5}
          title="Total Percentages"
          description="Display what percentage each cell represents of the grand total."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Percentage Interpretation">
      <p className="text-sm mt-2">
        Use row percentages to compare across columns, column percentages to compare across rows, 
        and total percentages for overall distribution patterns.
      </p>
    </HelpAlert>
  </div>
);

const FormatTab = () => (
  <div className="space-y-6">
    <HelpCard title="Table Format Options" icon={Settings} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Sort Order"
          description="Choose how to sort row and column categories in the table."
        />
        <HelpStep
          number={2}
          title="Missing Values"
          description="Decide how to handle missing data in the analysis."
        />
        <HelpStep
          number={3}
          title="Rounding"
          description="Set decimal places for percentages and statistics display."
        />
        <HelpStep
          number={4}
          title="Suppression Rules"
          description="Hide cells with small sample sizes to protect privacy."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Display Best Practices">
      <p className="text-sm mt-2">
        Clear formatting makes your results easier to interpret. Consider your audience 
        when choosing display options and rounding levels.
      </p>
    </HelpAlert>
  </div>
);

const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Quick Start" icon={FileText} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Ready to create your cross-tabulation analysis?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Select row and column variables in the Variables tab</li>
          <li>Choose statistics in the Statistics tab</li>
          <li>Configure cell display in the Cells tab</li>
          <li>Set formatting options in the Format tab</li>
          <li>Click OK to generate your cross-tabulation</li>
        </ol>
      </div>
    </HelpCard>

    <HelpCard title="Interpreting Results" icon={FileText} variant="feature">
      <div className="space-y-2">
        <p className="text-sm">Key insights to look for:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Significant Chi-Square results indicate relationships</li>
          <li>Association measures show relationship strength</li>
          <li>Residuals highlight significant cell differences</li>
          <li>Percentages reveal distribution patterns</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

export const Crosstabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: HelpCircle },
    { value: 'variables', label: 'Variables', icon: Table },
    { value: 'statistics', label: 'Statistics', icon: Calculator },
    { value: 'cells', label: 'Cells', icon: Table },
    { value: 'format', label: 'Format', icon: Settings }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Cross Tabulation Guide</h1>
        <p className="text-muted-foreground">
          Learn how to analyze relationships between categorical variables using cross-tabulation
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

        <TabsContent value="cells" className="mt-6">
          <CellsTab />
        </TabsContent>

        <TabsContent value="format" className="mt-6">
          <FormatTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

