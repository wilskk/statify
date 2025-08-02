/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { ArrowUpDown, Database, Settings, List } from 'lucide-react';

const SortVarsGuide = () => {
  const sections = [
    {
      id: 'functionality',
      title: 'Feature Overview',
      description: 'Complete explanation of the Sort Variables feature',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-sm mb-4">
            The "Sort Variables" feature allows you to rearrange variables 
            in the "Variable View" based on properties from any column.
          </p>
          
          <div className="space-y-3">
            <HelpCard title="Attribute-Based Sorting" variant="feature">
              <p className="text-sm">
                You can select any column from the variable view grid 
                (e.g., "Name", "Type", "Width") to use as the sorting key.
              </p>
            </HelpCard>
            
            <HelpCard title="Sort Direction" variant="feature">
              <p className="text-sm">
                Both ascending and descending sort directions are supported.
              </p>
            </HelpCard>
            
            <HelpCard title="Full Dataset Update" variant="feature">
              <p className="text-sm">
                This feature performs a comprehensive update. It reorders the 
                variable array and physically rearranges data columns to match
                the new variable order, ensuring data integrity.
              </p>
            </HelpCard>
            
            <HelpCard title="Direct Application" variant="feature">
              <p className="text-sm">
                Sorting is applied directly to your current dataset, and changes
                are saved in the application state.
              </p>
            </HelpCard>
          </div>
          
          <HelpAlert variant="info" title="Important Note">
            <p className="text-sm mt-2">
              Variable sorting changes the physical structure of your dataset,
              including the column order in the data array.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Workflow',
      description: 'Step-by-step variable sorting process',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpSection title="Step 1: Initialization">
            <p className="text-sm">
              You open the "Sort Variables" modal. The UI displays a list of
              variable attributes that can be sorted.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 2: User Interaction">
            <p className="text-sm">
              You select an attribute (e.g., "Name") and sort direction
              (e.g., "Ascending").
            </p>
          </HelpSection>
          
          <HelpSection title="Step 3: Execution">
            <div className="space-y-2">
              <p className="text-sm mb-2">The execution process includes:</p>
              <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                <li>You click the "OK" button</li>
                <li>
                  The system sorts the variable array based on your selected
                  attribute and direction. Each variable's position is updated
                  to reflect its new location.
                </li>
                <li>
                  The system then calculates new positions for each data column
                  and returns a newly sorted dataset.
                </li>
                <li>
                  The application state is updated with the new variable list
                  and data array.
                </li>
              </ul>
            </div>
          </HelpSection>
          
          <HelpAlert variant="success" title="Final Result">
            <p className="text-sm mt-2">
              Your dataset will have a new column order based on your selected
              sorting criteria, with data integrity maintained.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Effective Sorting',
      content: 'Choose the attribute most relevant to your analysis needs for optimal sorting results.'
    },
    {
      type: 'info' as const,
      title: 'Data Integrity',
      content: 'This feature ensures data consistency by physically rearranging columns.'
    },
    {
      type: 'warning' as const,
      title: 'Permanent Changes',
      content: 'Sorting will permanently change your dataset structure for the current session.'
    }
  ];

  const relatedTopics = [
    { title: 'Variable View', href: '/help/data-guide/variable-view' },
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Sort Cases', href: '/help/data-guide/sort-cases' },
    { title: 'Restructure Data', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Sort Variables Feature"
      description="Complete guide for rearranging variables in Variable View based on column properties"
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SortVarsGuide;