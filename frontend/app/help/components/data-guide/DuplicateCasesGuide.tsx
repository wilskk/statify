/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Copy, Search, Filter } from 'lucide-react';

const DuplicateCasesGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Introduction to the Identify Duplicate Cases feature',
      icon: Copy,
      content: (
        <div className="space-y-4">
          <p>
            This feature helps you find and manage duplicate cases in your dataset based on matching variables you choose.
          </p>
          
          <HelpAlert variant="info" title="What It Does">
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Identifies duplicate cases based on identical values in one or more variables</li>
              <li>Creates new indicator variables to mark which cases are "primary" and which are "duplicates"</li>
              <li>Sorts cases within duplicate groups to determine the primary case</li>
              <li>Helps you manage results by reorganizing data or filtering duplicate cases</li>
            </ul>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'specifications',
      title: 'Features & Options',
      description: 'Available features and options',
      icon: Search,
      content: (
        <div className="space-y-4">
          <HelpCard title="New Indicator Variables" variant="feature">
            <p className="text-sm mb-3">
              This feature can create two new variables to help with duplicate analysis:
            </p>
            
            <HelpSection title="1. Primary Case Indicator">
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Function</strong>: Creates a variable (default: <code>PrimaryLast</code>) that marks each case as primary (value 1) or duplicate (value 0)</li>
                <li><strong>Choice</strong>: You can choose whether the <strong>first</strong> or <strong>last</strong> case in each duplicate group is considered primary</li>
                <li><strong>Custom Name</strong>: You can change the variable name to suit your needs</li>
              </ul>
            </HelpSection>
            
            <HelpSection title="2. Sequence Counter">
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Function</strong>: Creates a variable (default: <code>MatchSequence</code>) that gives a sequence number for each case within duplicate groups (1, 2, 3, ...)</li>
                <li><strong>Use</strong>: Helps you see how many duplicates exist in each group</li>
                <li><strong>Custom Name</strong>: You can change the variable name to suit your needs</li>
              </ul>
            </HelpSection>
          </HelpCard>
          
          <HelpCard title="Management & Display Options" variant="feature">
            <div className="space-y-3">
              <HelpSection title="1. Move Duplicate Cases to Top">
                <p className="text-sm">
                  When enabled, all cases with duplicates are moved to the top of your data file for easy inspection.
                </p>
              </HelpSection>
              
              <HelpSection title="2. Filter Duplicate Cases">
                <p className="text-sm">
                  When enabled, after processing your dataset automatically shows only primary cases (where the indicator value is 1).
                </p>
              </HelpSection>
              
              <HelpSection title="3. Display Frequencies">
                <p className="text-sm">
                  When enabled, frequency tables for the new variables are displayed in the Output window.
                </p>
              </HelpSection>
            </div>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'examples',
      title: 'Usage Examples',
      description: 'Practical scenarios for using the feature',
      icon: Filter,
      content: (
        <div className="space-y-4">
          <HelpCard title="Example 1: Find Exact Duplicates" variant="step">
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Move <strong>all</strong> variables into the "Define matching cases by" list</li>
              <li>Choose whether the first or last case should be primary</li>
              <li>Click OK</li>
            </ol>
            <HelpAlert variant="success" title="Results">
              <p className="text-sm mt-2">
                The <code>PrimaryLast</code> variable will have value 0 for each row that is an exact duplicate of another.
              </p>
            </HelpAlert>
          </HelpCard>
          
          <HelpCard title="Example 2: Create Duplicate-Free Dataset" variant="step">
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Move key variables (like Customer ID, Email) to the "Define matching cases by" list</li>
              <li>In the <strong>Options</strong> tab, check "Filter out duplicate cases after processing"</li>
              <li>Click OK</li>
            </ol>
            <HelpAlert variant="success" title="Results">
              <p className="text-sm mt-2">
                Your data view will immediately update to show only unique/primary rows.
              </p>
            </HelpAlert>
          </HelpCard>
        </div>
      )
    },
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Backup Your Data',
      content: 'Always backup your dataset before processing duplicates to prevent data loss.'
    },
    {
      type: 'info' as const,
      title: 'Choose Key Variables',
      content: 'Select the right key variables to define duplication criteria that match your analysis needs.'
    },
    {
      type: 'warning' as const,
      title: 'Review Results',
      content: 'Always review duplicate detection results before permanently removing or filtering data.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Select Cases', href: '/help/data-guide/select-cases' },
    { title: 'Sort Cases', href: '/help/data-guide/sort-cases' },
    { title: 'Variable Properties', href: '/help/data-guide/define-var-props' }
  ];

  return (
    <HelpGuideTemplate
      title="Identify Duplicate Cases"
      description="Complete guide to finding and marking duplicate cases in your dataset based on matching variables"
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DuplicateCasesGuide;