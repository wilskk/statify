/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Database, Settings, Calculator, Play } from 'lucide-react';

const AggregateGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Understanding the basic concepts of data aggregation',
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>
            The Data Aggregation feature allows users to aggregate data by creating
            summary statistics for specific variables within groups defined by
            break variables. This is useful for summarizing information, calculating
            group averages, finding maximum values per group, counting occurrences,
            and much more.
          </p>
          
          <HelpAlert variant="tip" title="When to Use Aggregation">
            Use data aggregation when you want to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Calculate statistics per group (mean, sum, etc.)</li>
              <li>Summarize large datasets into more understandable information</li>
              <li>Create summary reports based on specific categories</li>
            </ul>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'configuration',
      title: 'Variable Configuration',
      description: 'How to set up variables for aggregation',
      icon: Settings,
      steps: [
        {
          title: 'Select Break Variables',
          description: 'Specify variables to use for grouping data',
          content: (
            <div className="space-y-3">
              <p>
                These variables define the groups for aggregation.
                Each unique combination of values in the break variables will
                create a group.
              </p>
              
              <HelpCard title="Example" variant="step">
                <p className="text-sm">
                  If "Gender" and "Region" are break variables, data will be
                  aggregated separately for each Gender-Region combination
                  (Male-Jakarta, Female-Jakarta, Male-Surabaya, etc.).
                </p>
              </HelpCard>
            </div>
          )
        },
        {
          title: 'Select Aggregated Variables',
          description: 'Specify variables to be summarized',
          content: (
            <div className="space-y-3">
              <p>
                These are the variables that will be summarized. For each
                selected variable, you can apply aggregation functions
                to calculate statistics for each group defined by the break variables.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'functions',
      title: 'Aggregation Functions',
      description: 'Various types of aggregation functions available',
      icon: Calculator,
      content: (
        <div className="space-y-6">
          <p>
            This feature provides several categories of aggregation functions:
          </p>
          
          <HelpCard title="Summary Statistics" variant="feature">
            <ul className="space-y-2">
              <li><strong>Mean</strong>: Calculates the average value across cases within each group</li>
              <li><strong>Median</strong>: Finds the middle value in each group when values are sorted</li>
              <li><strong>Sum</strong>: Calculates the total of all values in each group</li>
              <li><strong>Standard Deviation</strong>: Measures the amount of variation within each group</li>
            </ul>
          </HelpCard>

          <HelpCard title="Specific Values" variant="feature">
            <ul className="space-y-2">
              <li><strong>Maximum</strong>: Finds the highest value in each group</li>
              <li><strong>Minimum</strong>: Finds the lowest value in each group</li>
              <li><strong>First</strong>: Takes the first value that appears in each group</li>
              <li><strong>Last</strong>: Takes the last value that appears in each group</li>
            </ul>
          </HelpCard>

          <HelpCard title="Case Counts" variant="feature">
            <HelpAlert variant="info" title="Understanding Counts">
              These count options help you understand how many cases are in each group:
              - Use N to count valid responses
              - Use NMISS to count missing responses
              - NU gives you the total count including missing values
            </HelpAlert>
            
            <ul className="space-y-2 mt-4">
              <li><strong>Weighted (N)</strong>: Counts the number of cases in each group with non-missing values</li>
              <li><strong>Weighted Missing (NMISS)</strong>: Counts the number of cases with missing values</li>
              <li><strong>Unweighted (NU)</strong>: Counts the total number of cases in each group</li>
            </ul>
          </HelpCard>

          <HelpCard title="Percentages, Fractions, Counts" variant="feature">
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold mb-2">Percentages</h5>
                <p className="text-sm text-muted-foreground mb-2">
                  Calculates the percentage of cases meeting specific criteria:
                </p>
                <ul className="space-y-1 text-sm ml-4">
                  <li><strong>Above</strong>: Percentage of cases above a specified value</li>
                  <li><strong>Below</strong>: Percentage of cases below a specified value</li>
                  <li><strong>Within</strong>: Percentage of cases between two specified values</li>
                  <li><strong>Outside</strong>: Percentage of cases outside a specified value range</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p><strong>Fractions</strong>: Similar to percentages but expressed as proportions (0-1 instead of 0-100)</p>
                <p><strong>Counts</strong>: Simple counting of cases meeting criteria</p>
              </div>
            </div>
          </HelpCard>
        </div>
      )
    },
  ];



  const prerequisites = [
    'Your data is loaded in Statify',
    'You know which variables you want to group by',
    'You understand what each variable represents'
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Keep It Simple',
      content: 'Start with just one break variable to see how aggregation works before adding more complex groupings.'
    },
    {
      type: 'warning' as const,
      title: 'Check Your Results',
      content: 'Always review your aggregated results to make sure they make sense for your analysis.'
    },
    {
      type: 'tip' as const,
      title: 'Save Your Work',
      content: 'Save your dataset before running aggregation, so you can always go back to your original data.'
    }
  ];

  const relatedTopics = [
    { title: 'Import Data', href: '/help/file-guide/import-sav' },
    { title: 'Variable Definition', href: '/help/data-guide/define-var-props' },
    { title: 'Descriptive Statistics', href: '/help/statistics-guide/descriptive' }
  ];

  return (
    <HelpGuideTemplate
      title="Data Aggregation Feature"
      description="This document explains the functionality of the Data Aggregation feature, which allows users to combine data into summary statistics across groups."
      lastUpdated="2024-01-15"
      sections={sections}
      prerequisites={prerequisites}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default AggregateGuide;