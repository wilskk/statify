/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { ArrowUpDown, SortAsc, Settings } from 'lucide-react';

const SortCasesGuide = () => {
  const sections = [
    {
      id: 'interface',
      title: 'Interface & Component Functionality',
      description: 'Components within the Sort Cases dialog',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Available Variables List">
            <p className="text-sm">
              Displays all variables available to use as sorting keys.
            </p>
          </HelpSection>
          
          <HelpSection title="Sort By List">
            <p className="text-sm">
              This list holds variables selected as sorting keys.
              The order here determines sorting priority.
            </p>
          </HelpSection>
          
          <HelpSection title="Sorting Controls">
            <p className="text-sm mb-3">
              When a variable in the "Sort By" list is highlighted:
            </p>
            <div className="ml-4 space-y-2">
              <HelpCard title="Sort Direction" variant="step">
                <p className="text-sm">
                  Choose to sort in ascending or descending order.
                </p>
              </HelpCard>
              <HelpCard title="Sort Priority" variant="step">
                <p className="text-sm">
                  Buttons to change the sorting priority of variables.
                </p>
              </HelpCard>
            </div>
          </HelpSection>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Workflow & Usage Examples',
      description: 'Practical examples of using Sort Cases',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpCard title="Example 1: Single-Level Sorting" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Goal</strong>: Sort your entire dataset by Income 
                from highest to lowest.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Steps:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Open the "Sort Cases" dialog</li>
                  <li>Move the Income variable to the "Sort By" list</li>
                  <li>Select Descending for the "Sort Order"</li>
                  <li>Click OK</li>
                </ol>
              </div>
            </div>
          </HelpCard>
          
          <HelpCard title="Example 2: Multi-Level Sorting" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Goal</strong>: Group cases by Department, then within 
                each department, sort by Income from highest to lowest.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Steps:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Move Department variable to "Sort By" (Ascending)</li>
                  <li>Move Income variable to "Sort By" below Department</li>
                  <li>Change Income direction to Descending</li>
                  <li>Click OK</li>
                </ol>
              </div>
            </div>
          </HelpCard>
          
          <HelpAlert variant="info" title="Multi-Level Sorting Tips">
            <p className="text-sm mt-2">
              The order of variables in the "Sort By" list determines sorting priority. 
              The first variable has the highest priority.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Priority Order',
      content: 'The first selected variable has the highest priority in multi-level sorting.'
    },
    {
      type: 'info' as const,
      title: 'Sort Direction',
      content: 'Ascending: from smallest to largest. Descending: from largest to smallest.'
    },
    {
      type: 'warning' as const,
      title: 'Order Changes',
      content: 'Sorting will permanently change the row order in your dataset.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Select Cases', href: '/help/data-guide/select-cases' },
    { title: 'Sort Variables', href: '/help/data-guide/sort-vars' },
    { title: 'Data Preparation', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Sort Cases Feature"
      description="This guide explains the Sort Cases functionality, which allows you to rearrange rows (cases) in your dataset based on values from one or more variables."

      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SortCasesGuide;