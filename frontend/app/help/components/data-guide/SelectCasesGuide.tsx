/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Filter, Search, Settings, FileText } from 'lucide-react';

const SelectCasesGuide = () => {
  const sections = [
    {
      id: 'selection-methods',
      title: 'Selection Methods',
      description: 'Different ways to select cases in your dataset',
      icon: Filter,
      content: (
        <div className="space-y-4">
          <HelpCard title="All Cases" variant="feature">
            <p className="text-sm">
              Select this option to include all cases in your dataset. This effectively
              removes any previously applied filters.
            </p>
          </HelpCard>
          
          <HelpCard title="Based on Condition" variant="feature">
            <p className="text-sm mb-3">
              Create logical expressions to filter cases. Only cases that meet your
              condition will be selected.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-sm mb-1">Available operators:</p>
              <p className="text-xs font-mono">&gt;, &lt;, ==, != (comparison)</p>
              <p className="text-xs font-mono">& (AND), | (OR), ~ (NOT)</p>
            </div>
          </HelpCard>
          
          <HelpCard title="Random Sample" variant="feature">
            <p className="text-sm mb-3">Select a random subset of cases:</p>
            <div className="space-y-2 text-sm">
              <div><strong>Approximately</strong>: Selects about a certain percentage of total cases.</div>
              <div><strong>Exactly</strong>: Selects an exact number of cases from the first N cases.</div>
            </div>
          </HelpCard>
          
          <HelpCard title="Based on Range" variant="feature">
            <p className="text-sm">
              Select cases based on their position in your dataset (1-based index).
            </p>
          </HelpCard>
          
          <HelpCard title="Use Filter Variable" variant="feature">
            <p className="text-sm">
              Use an existing variable as a filter. Non-zero/non-empty values will be selected.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'output-options',
      title: 'Output Options',
      description: 'Options for handling unselected cases',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Filter Unselected Cases" variant="step">
            <p className="text-sm">
              A filter is applied to temporarily hide unselected cases. A filter variable 
              (<code className="text-xs bg-gray-100 px-1 rounded">filter_$</code>) will be created or updated. 
              Your original dataset remains intact.
            </p>
          </HelpCard>
          
          <HelpCard title="Delete Unselected Cases" variant="step">
            <p className="text-sm">
              Unselected cases will be{' '}
              <strong>permanently deleted</strong> from your dataset. This operation
              cannot be undone.
            </p>
          </HelpCard>
          
          <HelpAlert variant="warning" title="Important">
            <p className="text-sm mt-2">
              Always backup your data before using the permanent delete option.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'usage-examples',
      title: 'Usage Examples',
      description: 'Practical examples of using the Select Cases feature',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <HelpSection title="Filter by Condition">
            <p className="text-sm mb-2">
              To select cases where age &gt; 30 AND income &gt;= 50000:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm font-mono">age &gt; 30 & income &gt;= 50000</code>
            </div>
          </HelpSection>
          
          <HelpSection title="Create Random Sample">
            <p className="text-sm mb-2">
              To create a 10% random sample:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              1. Select "Random sample"<br/>
              2. Choose "Approximately"<br/>
              3. Enter "10"
            </div>
          </HelpSection>
          
          <HelpSection title="Select Range">
            <p className="text-sm mb-2">
              To select cases 100 to 500:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              1. Select "Based on... range"<br/>
              2. Enter "100" in "First Case"<br/>
              3. Enter "500" in "Last Case"
            </div>
          </HelpSection>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Condition Syntax',
      content: 'Use quotes for string values and ensure variable names are spelled correctly.'
    },
    {
      type: 'warning' as const,
      title: 'Permanent Operations',
      content: 'Be careful with permanent delete options - this operation cannot be undone.'
    },
    {
      type: 'info' as const,
      title: 'Filter Variable',
      content: 'A filter_$ variable will be automatically created to track selected cases.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Sort Cases', href: '/help/data-guide/sort-cases' },
    { title: 'Weight Cases', href: '/help/data-guide/weight-cases' },
    { title: 'Split File', href: '/help/data-guide/split-file' }
  ];

  return (
    <HelpGuideTemplate
      title="Select Cases Feature"
      description="This guide explains the Select Cases feature, which allows you to filter or delete rows (cases) based on various criteria."
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SelectCasesGuide;