/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { RotateCcw, ArrowUpDown, Database, Settings, Grid } from 'lucide-react';

const TransposeGuide = () => {
  const sections = [
    {
      id: 'interface',
      title: 'Interface & Component Functionality',
      description: 'Main components in the transpose feature',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Available Variables List" variant="feature">
            <p className="text-sm">
              Displays all variables available in your current dataset.
            </p>
          </HelpCard>
          
          <HelpCard title="Variables to Transpose" variant="feature">
            <p className="text-sm">
              This list holds the variables you've selected to become rows
              in your new dataset.
            </p>
          </HelpCard>
          
          <HelpCard title="Name Variable (Optional)" variant="feature">
            <p className="text-sm">
              This field is optional. You can move <strong>one</strong>{' '}
              variable here. Values from each row of this variable will be
              used as names for the new variables (columns) to be created.
            </p>
          </HelpCard>
          
          <HelpAlert variant="info" title="Usage Tip">
            <p className="text-sm mt-2">
              Drag and drop variables between components to configure your transpose setup.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'new-variables',
      title: 'New Variables Created',
      description: 'Variables that will be created after transpose',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpCard title="case_lbl" variant="feature">
            <p className="text-sm">
              This variable is created automatically. This column will contain
              the names of the original variables you selected for transposition.
            </p>
          </HelpCard>
          
          <HelpCard title="New Case Variables" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                New variables (columns) will be created, one for each case (row) in your original data.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HelpCard title="Without Name Variable" variant="step">
                  <p className="text-sm">
                    New column names will be `Var1`, `Var2`, `Var3`, and so on.
                  </p>
                </HelpCard>
                
                <HelpCard title="With Name Variable" variant="step">
                  <p className="text-sm">
                    New column names will be taken from values in that variable.
                  </p>
                </HelpCard>
              </div>
            </div>
          </HelpCard>
          
          <HelpAlert variant="success" title="Transpose Result">
            <p className="text-sm mt-2">
              Your data structure will change from wide format to long format or vice versa.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'examples',
      title: 'Usage Examples',
      description: 'Practical transpose usage scenarios',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpCard title="Scenario 1: Simple Transpose (Wide to Long)" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                You have quarterly sales data with columns `Q1`, `Q2`, `Q3`, `Q4`. 
                You want each quarter to become a row.
              </p>
              
              <HelpSection title="Steps:">
                <ol className="list-decimal list-inside ml-4 text-sm space-y-1">
                  <li>Move variables `Q1`, `Q2`, `Q3`, and `Q4` to the "Variable(s)" list.</li>
                  <li>Leave the "Name Variable" empty.</li>
                  <li>Click OK.</li>
                </ol>
              </HelpSection>
            </div>
          </HelpCard>
          
          <HelpCard title="Scenario 2: Using Values as Column Names" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                You have yearly data with columns `Product_ID`, `Year_2020`, `Year_2021`, `Year_2022`. 
                You want each year to become a row and use `Product_ID` as the new column name.
              </p>
              
              <HelpSection title="Steps:">
                <ol className="list-decimal list-inside ml-4 text-sm space-y-1">
                  <li>Move `Year_2020`, `Year_2021`, `Year_2022` to the "Variable(s)" list.</li>
                  <li>Move `Product_ID` to the "Name Variable" list.</li>
                  <li>Click OK.</li>
                </ol>
              </HelpSection>
            </div>
          </HelpCard>
          
          <HelpAlert variant="warning" title="Important">
            <p className="text-sm mt-2">
              Ensure selected variables have compatible data types for transposition.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Name Variable',
      content: 'Use the name variable to provide meaningful names for new columns.'
    },
    {
      type: 'info' as const,
      title: 'case_lbl',
      content: 'The case_lbl variable will be automatically created to store original variable names.'
    },
    {
      type: 'warning' as const,
      title: 'Data Types',
      content: 'Ensure variables being transposed have consistent data types.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Restructure Data', href: '/help/data-guide/restructure' },
    { title: 'Sort Variables', href: '/help/data-guide/sort-vars' },
    { title: 'Merge Data', href: '/help/data-guide/merge' }
  ];

  return (
    <HelpGuideTemplate
      title="Transpose Data Feature"
      description="This guide explains the 'Transpose' functionality, a powerful tool for restructuring your dataset by swapping rows and columns."
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default TransposeGuide;