import React from 'react';
import { HelpGuideTemplate } from '@/app/help/ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, HelpCircle, FileText } from 'lucide-react';

export const UnusualCasesGuide: React.FC = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Understanding Unusual Cases',
      description: 'Learn how to identify and handle unusual or anomalous data points',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="What are Unusual Cases?">
            <p className="text-sm mt-2">
              Unusual cases are data points that significantly differ from the majority of your dataset. 
              These might be outliers, extreme values, or cases with unique characteristics that warrant special attention.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'identification',
      title: 'Identifying Unusual Cases',
      description: 'Methods to detect unusual patterns in your data',
      icon: Calculator,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Review Descriptive Statistics"
            description="Check minimum, maximum, and standard deviation values for extreme values."
          />
          <HelpStep
            number={2}
            title="Use Visual Inspection"
            description="Examine histograms, box plots, or scatter plots to spot outliers visually."
          />
          <HelpStep
            number={3}
            title="Apply Statistical Methods"
            description="Use z-scores, IQR method, or other statistical techniques to identify unusual cases."
          />
          <HelpStep
            number={4}
            title="Consider Context"
            description="Evaluate whether unusual values make sense in your specific context or domain."
          />
        </div>
      )
    },
    {
      id: 'handling',
      title: 'Handling Unusual Cases',
      description: 'Best practices for dealing with anomalous data',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <HelpCard title="Approaches to Consider" variant="feature">
            <ul className="text-sm space-y-2 mt-2">
              <li><strong>Investigate:</strong> Determine if unusual cases are errors or genuine phenomena</li>
              <li><strong>Verify:</strong> Double-check data entry and measurement processes</li>
              <li><strong>Document:</strong> Keep records of identified unusual cases and decisions made</li>
              <li><strong>Analyze Separately:</strong> Consider running analyses with and without unusual cases</li>
              <li><strong>Transform:</strong> Apply appropriate data transformations if needed</li>
            </ul>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'warning' as const,
      title: 'Don\'t Delete Automatically',
      content: 'Avoid removing unusual cases without proper investigation - they might be meaningful'
    },
    {
      type: 'info' as const,
      title: 'Context Matters',
      content: 'What\'s unusual in one context might be normal in another - always consider your domain'
    },
    {
      type: 'tip' as const,
      title: 'Document Decisions',
      content: 'Keep clear records of how you handled unusual cases for reproducibility'
    }
  ];

  const relatedTopics = [
    { title: "Descriptive Statistics", href: "/help/statistics-guide/descriptive" },
    { title: "Data Exploration", href: "/help/statistics-guide/descriptive/explore" },
    { title: "Select Cases", href: "/help/data-guide/select-cases" },
    { title: "Data Guide", href: "/help/data-guide" }
  ];

  return (
    <HelpGuideTemplate
      title="Unusual Cases Guide"
      description="Learn how to identify, investigate, and handle unusual or anomalous data points in your analysis"
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};
