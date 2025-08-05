import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Ruler, Hash, Settings } from 'lucide-react';

export default function SetMeasurementLevelGuide() {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Introduction to the Set Measurement Level feature',
      icon: Ruler,
      content: (
        <div className="space-y-4">
          <p>
            This feature helps you quickly define measurement levels for your variables.
            When opened, it automatically detects and displays all variables in your dataset
            that don't have their measurement level determined yet. You can easily move
            these variables to the appropriate category using an intuitive interface.
          </p>
          
          <HelpAlert variant="info" title="Why It Matters">
            <p className="text-sm mt-2">
              Measurement level determines what statistical analyses you can perform
              and how to interpret your results. Proper classification is essential
              for valid analysis.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'interface',
      title: 'Interface and Components',
      description: 'Components within the Set Measurement Level modal',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Available Variables List" variant="feature">
            <p className="text-sm">
              Displays all variables with unknown measurement levels.
              These variables appear automatically when the modal opens.
            </p>
          </HelpCard>
          
          <HelpCard title="Target Lists" variant="feature">
            <p className="text-sm mb-3">
              Three separate boxes to hold variables based on their measurement level:
            </p>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Nominal</p>
                <p className="text-xs">
                  For categorical data without order (e.g., 'Gender', 'City').
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Ordinal</p>
                <p className="text-xs">
                  For categorical data with order (e.g., 'Education Level', 'Customer Satisfaction').
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Scale</p>
                <p className="text-xs">
                  For quantitative/numeric data (e.g., 'Age', 'Income').
                </p>
              </div>
            </div>
          </HelpCard>
          
          <HelpCard title="Arrow Buttons" variant="feature">
            <p className="text-sm">
              Allow you to move highlighted variables from the "Available" list
              to the appropriate target list. Select variables first, then click
              the arrow button pointing to your desired category.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Workflow and Usage Examples',
      description: 'Step-by-step guide to using this feature',
      icon: Hash,
      content: (
        <div className="space-y-4">
          <HelpSection title="Step 1: Initialization">
            <p className="text-sm">
              When you open the modal, all variables with unknown measurement levels
              are automatically loaded into the "Available" list.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 2: User Interaction">
            <p className="text-sm">
              Select one or more variables from the "Available" list
              and use the arrow buttons to move them to the appropriate
              Nominal, Ordinal, or Scale category.
            </p>
          </HelpSection>
          
          <HelpSection title="Step 3: Save Changes">
            <p className="text-sm">
              Click **OK** and the measurement levels for moved variables
              are permanently updated in your dataset.
            </p>
          </HelpSection>
          
          <HelpAlert variant="success" title="Usage Tips">
            <div className="text-sm mt-2 space-y-1">
              <p>• You can select multiple variables at once using Ctrl+Click</p>
              <p>• Variables can be moved back if you change your mind about the category</p>
              <p>• Changes are only saved after clicking OK</p>
            </div>
          </HelpAlert>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Quick Identification',
      content: 'Consider the nature of your data: is it categorical (nominal/ordinal) or numeric (scale)?'
    },
    {
      type: 'info' as const,
      title: 'Multiple Selection',
      content: 'Use Ctrl+Click to select multiple variables at once and move them together.'
    },
    {
      type: 'warning' as const,
      title: 'Validate Results',
      content: 'Always double-check your selected categories before saving changes.'
    }
  ];

  const relatedTopics = [
    { title: 'Variable Properties', href: '/help/data-guide/define-var-props' },
    { title: 'Data Types Guide', href: '/help/data-guide' },
    { title: 'Descriptive Statistics', href: '/help/statistics-guide/descriptive' },
    { title: 'Data Validation', href: '/help/data-guide/unusual-cases' }
  ];

  return (
    <HelpGuideTemplate
      title="Set Measurement Level Feature"
      description="This guide provides an overview of the 'Set Measurement Level' feature that allows you to efficiently define measurement levels (Nominal, Ordinal, or Scale) for variables that currently have 'Unknown' measurement levels."
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
}