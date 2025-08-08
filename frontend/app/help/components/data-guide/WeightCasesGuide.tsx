/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Scale, Settings, Eye } from 'lucide-react';

const WeightCasesGuide = () => {
  const sections = [
    {
      id: 'functionality',
      title: 'Feature Overview',
      description: 'Explanation of case weighting feature',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <HelpCard title="Variable-Based Weighting" variant="feature">
            <p className="text-sm">
              You can select one numeric variable from the available list.
              Values from this variable will be used to weight each case.
            </p>
          </HelpCard>
          
          <HelpCard title="Type Validation" variant="feature">
            <p className="text-sm">
              The dialog automatically filters the list to show only numeric variables
              as valid candidates for weighting.
            </p>
          </HelpCard>
          
          <HelpCard title="Case Exclusions" variant="feature">
            <p className="text-sm">
              Any case with zero, negative, or missing values for the selected
              weighting variable will automatically be excluded from analyses
              using these weights.
            </p>
          </HelpCard>
          
          <HelpCard title="Global Setting" variant="feature">
            <p className="text-sm">
              Weighting configuration is a global setting. The dialog displays
              the currently active weighting variable, or "Do not weight cases"
              if none is selected.
            </p>
          </HelpCard>
          
          <HelpCard title="Disabling Weighting" variant="feature">
            <p className="text-sm">
              To turn off weighting, simply remove the variable from the
              "Weight cases by" list and confirm by clicking "OK".
            </p>
          </HelpCard>
          
          <HelpAlert variant="info" title="Important Note">
            <p className="text-sm mt-2">
              Case weighting affects all statistical analyses performed after activation.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Workflow',
      description: 'Step-by-step feature usage',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Step 1: Initialization">
            <p className="text-sm">
              The modal initializes, fetching the variable list and current weight status.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 2: Display">
            <p className="text-sm">
              The UI renders the dialog with available variables and the currently
              selected weight variable (if any).
            </p>
          </HelpSection>
          
          <HelpSection title="Step 3: Selection">
            <p className="text-sm">
              You move a numeric variable into the target "Weight cases by" list.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 4: Confirmation">
            <p className="text-sm">
              You click "OK". This triggers saving the global weight status.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 5: Global Update">
            <p className="text-sm">
              The global storage is updated with the new weight variable name
              (or empty string if none selected).
            </p>
          </HelpSection>
          
          <HelpSection title="Step 6: Completion">
            <p className="text-sm">
              The dialog closes.
            </p>
          </HelpSection>
          
          <HelpAlert variant="success" title="Process Complete">
            <p className="text-sm mt-2">
              After completion, weighting will be active for all subsequent analyses.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Variable Validation',
      content: 'Ensure the selected weighting variable is a valid numeric variable.'
    },
    {
      type: 'warning' as const,
      title: 'Invalid Values',
      content: 'Cases with zero, negative, or missing values will be excluded from analysis.'
    },
    {
      type: 'info' as const,
      title: 'Global Setting',
      content: 'Weighting is a global setting that affects all analyses.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Statistical Analysis', href: '/help/statistics-guide' },
    { title: 'Variable Types', href: '/help/data-guide/variable-types' }
  ];

  return (
    <HelpGuideTemplate
      title="Case Weighting Feature"
      description="This guide explains the Case Weighting functionality, which allows you to apply case weights to your dataset based on values from a numeric variable"

      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default WeightCasesGuide;