/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { RefreshCw, ArrowRightLeft, Database, Settings, FileText } from 'lucide-react';

const RestructureGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Introduction to the data restructuring wizard',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p>
            This feature provides a step-by-step wizard to easily restructure your dataset. 
            You can transform your data between wide and long formats, or transpose your entire dataset. 
            This is useful when your current data format doesn't match the requirements of your intended analysis.
          </p>
          
          <HelpAlert variant="info" title="When to Use Data Restructuring">
            <p className="text-sm mt-2">
              Use data restructuring when your current format doesn't fit your analysis needs. 
              For example, repeated measures analysis typically requires long format, 
              while some multivariate analyses work better with wide format data.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'restructure-methods',
      title: 'Restructuring Methods',
      description: 'Available data restructuring options',
      icon: ArrowRightLeft,
      content: (
        <div className="space-y-4">
          <HelpCard title="Variables to Cases" variant="feature">
            <p className="text-sm">
              Transform multiple variables (columns) into fewer variables by creating new cases (rows). 
              This converts wide format data to long format, commonly needed for repeated measures analysis.
            </p>
          </HelpCard>
          
          <HelpCard title="Cases to Variables" variant="feature">
            <p className="text-sm">
              The reverse of the previous method - transform multiple cases (rows) into variables (columns). 
              This converts long format data to wide format.
            </p>
          </HelpCard>
          
          <HelpCard title="Transpose All Data" variant="feature">
            <p className="text-sm">
              Simply swap all rows and columns in your dataset. This transposes the entire dataset.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'wizard-flow',
      title: 'Wizard Flow',
      description: 'Step-by-step guide to using the restructuring wizard',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            The wizard guides you through a simple 3-step process. Each step must be completed 
            before moving to the next one.
          </p>
          
          <HelpSection title="Step 1: Choose Restructuring Method">
            <p className="text-sm">
              Select one of the three restructuring methods described above based on your needs.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 2: Configure Variables">
            <p className="text-sm mb-3">
              Based on your chosen method, configure the variables using the drag-and-drop interface:
            </p>
            
            <div className="space-y-3">
              <HelpCard title='For "Variables to Cases"' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Select variables to transform into new cases</li>
                  <li>• Name the new variable that will be created</li>
                  <li>• Name the variable that will contain original values</li>
                </ul>
              </HelpCard>
              
              <HelpCard title='For "Cases to Variables"' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Select the identifier variable that groups cases</li>
                  <li>• Select the variable containing values for new variables</li>
                  <li>• Name the new variables that will be created</li>
                </ul>
              </HelpCard>
              
              <HelpCard title='For "Transpose All Data"' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• No additional configuration needed</li>
                  <li>• System will swap all rows and columns automatically</li>
                </ul>
              </HelpCard>
            </div>
          </HelpSection>
          
          <HelpSection title="Step 3: Review and Confirm">
            <p className="text-sm">
              Before applying changes, the system shows a preview of the results. 
              Review and confirm the restructuring before it's applied permanently.
            </p>
          </HelpSection>
          
          <HelpAlert variant="warning" title="Important">
            <p className="text-sm mt-2">
              Data restructuring can significantly change your dataset structure. 
              Make sure you understand the implications before applying changes.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Tips and Best Practices',
      description: 'Best practices for effective data restructuring',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpCard title="Backup Your Data" variant="step">
              <p className="text-sm">
                Always create a backup of your dataset before major restructuring 
                to prevent data loss.
              </p>
            </HelpCard>
            
            <HelpCard title="Validate Results" variant="step">
              <p className="text-sm">
                Check the results to ensure no data is lost or distorted during the process.
              </p>
            </HelpCard>
            
            <HelpCard title="Test with Subset" variant="step">
              <p className="text-sm">
                Try restructuring with a small subset of your data first 
                before applying to the entire dataset.
              </p>
            </HelpCard>
            
            <HelpCard title="Document Changes" variant="step">
              <p className="text-sm">
                Record your restructuring steps for reproducibility and future reference.
              </p>
            </HelpCard>
          </div>
          
          <HelpAlert variant="success" title="Pro Tip">
            <p className="text-sm mt-2">
              Use the preview feature to see restructuring results before applying them. 
              This helps ensure the outcome matches your expectations.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Plan Your Format',
      content: 'Plan your desired data structure before starting restructuring for optimal results.'
    },
    {
      type: 'info' as const,
      title: 'Analysis Compatibility',
      content: 'Ensure the resulting data format is compatible with your intended analysis type.'
    },
    {
      type: 'warning' as const,
      title: 'Validate Integrity',
      content: 'Always validate data integrity after restructuring to ensure no data is lost.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Transpose Data', href: '/help/data-guide/transpose' },
    { title: 'Sort Cases', href: '/help/data-guide/sort-cases' },
    { title: 'Aggregate Data', href: '/help/statistics-guide/descriptive' }
  ];

  return (
    <HelpGuideTemplate
      title="Data Restructuring Guide"
      description="Step-by-step wizard to easily restructure your dataset"
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default RestructureGuide;