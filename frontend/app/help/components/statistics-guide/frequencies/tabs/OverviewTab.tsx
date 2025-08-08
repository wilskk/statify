import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { HelpCircle, FileText } from 'lucide-react';

export const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What is Frequency Analysis?">
      <p className="text-sm mt-2">
        Frequency analysis counts how often each unique value appears in your data. 
        This helps you understand the distribution of values and identify patterns.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Frequency Analysis" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Understanding categorical data distribution</li>
        <li>• Identifying the most common values</li>
        <li>• Checking data quality and missing values</li>
        <li>• Preparing data for further analysis</li>
      </ul>
    </HelpCard>

    <HelpCard title="What You'll Learn" icon={FileText} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• How to select variables for analysis</li>
        <li>• Available statistics options</li>
        <li>• Chart customization options</li>
        <li>• How to interpret results</li>
      </ul>
    </HelpCard>
  </div>
);