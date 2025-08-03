/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Calendar, Clock, Database, Settings } from 'lucide-react';

const DefineDateTimeGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Complete guide to setting up date and time structure for your data',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p>
            The Define Date feature helps you create a time-based structure for your data. 
            When you choose a date format (like "Year, quarter, month"), the system automatically:
          </p>
          <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
            <li>
              <strong>Creates new variables</strong> for each time component you need
              (like YEAR_, QUARTER_, MONTH_).
            </li>
            <li>
              <strong>Builds a formatted date variable</strong> called DATE_ that shows
              complete dates in a readable format.
            </li>
            <li>
              <strong>Shows you a preview</strong> with sample data so you can see
              exactly how your date structure will look.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'functionality',
      title: 'How It Works',
      description: 'Understanding the process step by step',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Automatic Setup">
            <p className="text-sm mt-2">
              Once you choose your date format, the system automatically sets up your variables 
              so time series analysis will work correctly with your data.
            </p>
          </HelpAlert>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Example: Year and Month</h4>
            <HelpCard title="What You'll Get" variant="feature">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Your choice</strong>: Year, month</li>
                <li><strong>Starting values</strong>: Year: 2022, Month: 11</li>
                <li><strong>New variables created</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>YEAR_</code> - shows the year (2022)</li>
                    <li><code>MONTH_</code> - shows the month (11)</li>
                    <li><code>DATE_</code> - shows formatted date (2022-11)</li>
                  </ul>
                </li>
              </ul>
            </HelpCard>
            
            <h4 className="font-semibold">Example: Week and Workday</h4>
            <HelpCard title="What You'll Get" variant="feature">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Your choice</strong>: Week, workday (5-day week)</li>
                <li><strong>Starting values</strong>: Week: 51, Workday: 4</li>
                <li><strong>New variables created</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>WEEK_</code> - shows the week number (51)</li>
                    <li><code>WDAY_</code> - shows the workday (4)</li>
                    <li><code>DATE_</code> - shows formatted date (51-4)</li>
                  </ul>
                </li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    },
    {
      id: 'supported-formats',
      title: 'Available Formats',
      description: 'Choose the right date format for your data',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>
            Here are all the date formats you can choose from. Each option creates
            the right variables and a formatted DATE_ variable for your needs.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <HelpCard title="Basic Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Year only</li>
                <li>Year, quarter</li>
                <li>Year, month</li>
                <li>Year, quarter, month</li>
                <li>Day only</li>
                <li>Week, day</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="Workday Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Week, workday (5-day week)</li>
                <li>Week, workday (6-day week)</li>
                <li>Day, work hours (8-hour)</li>
                <li>Week, workday, hour</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="Time Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Hour only</li>
                <li>Day, hour</li>
                <li>Week, day, hour</li>
                <li>Minute only</li>
                <li>Hour, minute</li>
                <li>Day, hour, minute</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="High Precision" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Second only</li>
                <li>Minute, second</li>
                <li>Hour, minute, second</li>
                <li>Remove date (clears existing date definition)</li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    },
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Plan Your Format',
      content: 'Think about your date structure before starting time series analysis for best results.'
    },
    {
      type: 'info' as const,
      title: 'Preview Your Data',
      content: 'The system shows sample data so you can see exactly how your dates will look.'
    },
    {
      type: 'warning' as const,
      title: 'Save Your Work',
      content: 'Your date setup affects all time series analysis, so save your dataset after setting up dates.'
    }
  ];

  const relatedTopics = [
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Time Series Analysis', href: '/help/statistics-guide' },
    { title: 'Variable Properties', href: '/help/data-guide/define-var-props' },
    { title: 'Restructure Data', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Define Date Feature"
      description="Complete guide to setting up time-based structure for your dataset"
      category="Data Management"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DefineDateTimeGuide;