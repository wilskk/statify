/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Settings, Database, FileText } from 'lucide-react';

const DefineVarPropsGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Introduction to the Define Variable Properties feature',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p>
            The Define Variable Properties feature helps you review and set up your 
            data variables correctly. It works in two simple steps:
          </p>
          
          <HelpCard title="Two-Step Process" variant="feature">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Review</strong>: Select variables from your dataset and 
                review their current properties and values.
              </li>
              <li>
                <strong>Edit</strong>: Update variable names, labels, types, and 
                other properties to make your data ready for analysis.
              </li>
            </ol>
          </HelpCard>
          
          <HelpAlert variant="info" title="Main Goal">
            <p className="text-sm mt-2">
              This feature helps ensure your data is properly labeled and organized, 
              which is essential for accurate analysis.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'How It Works',
      description: 'Step-by-step process for using the feature',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            This feature guides you through a simple two-step process to set up your variables.
          </p>
          
          <HelpSection title="Step 1: Select Variables">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                You'll see two lists: "Available Variables" and "Variables to Review".
              </li>
              <li>
                Move the variables you want to work with from "Available" to "Review".
              </li>
              <li>
                You can set limits on:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>How many rows to review (helpful for large datasets).</li>
                  <li>How many unique values to display per variable.</li>
                </ul>
              </li>
              <li>
                Click "Continue" to move to the next step.
              </li>
            </ul>
          </HelpSection>
          
          <HelpSection title="Step 2: Edit Properties">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Variable Grid</strong>: Your selected variables appear in an editable grid.
              </li>
              <li>
                <strong>What You Can Edit</strong>:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li><strong>Name</strong>: The variable name.</li>
                  <li><strong>Label</strong>: A descriptive label for the variable.</li>
                  <li><strong>Measurement Level</strong>: Set to Nominal, Ordinal, or Scale.</li>
                  <li><strong>Role</strong>: Define how the variable is used (Input, Target, etc.).</li>
                  <li><strong>Type</strong>: Set data type (Numeric, String, Date).</li>
                </ul>
              </li>
              <li>
                <strong>Auto-Suggestions</strong>: Use the "Suggest Measurement Level" button 
                to get recommendations based on your data.
              </li>
              <li>
                <strong>Value Labels</strong>: For each unique value found in your data, you can:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Add a descriptive text label.</li>
                  <li>Mark specific values as "Missing".</li>
                </ul>
              </li>
              <li>
                <strong>Save Changes</strong>: Click "OK" to save your changes.
              </li>
            </ul>
          </HelpSection>
          
          <HelpAlert variant="success" title="Benefits">
            <p className="text-sm mt-2">
              This process ensures your variables are properly labeled and organized, 
              making your data ready for accurate analysis.
            </p>
          </HelpAlert>
        </div>
      )
    },
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Performance Tip',
      content: 'Use reasonable limits for large datasets to keep the process running smoothly.'
    },
    {
      type: 'info' as const,
      title: 'Auto-Suggestions',
      content: 'Use the "Suggest Measurement Level" feature to get helpful recommendations.'
    },
    {
      type: 'warning' as const,
      title: 'Check Your Work',
      content: 'Always double-check missing value settings to ensure accurate analysis.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Set Measurement Level', href: '/help/data-guide/set-measurement-level' },
    { title: 'Define Date Time', href: '/help/data-guide/define-date-time' },
    { title: 'Select Cases', href: '/help/data-guide/select-cases' }
  ];

  return (
    <HelpGuideTemplate
      title="Define Variable Properties"
      description="Complete guide to reviewing and setting up your data variables"

      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DefineVarPropsGuide;