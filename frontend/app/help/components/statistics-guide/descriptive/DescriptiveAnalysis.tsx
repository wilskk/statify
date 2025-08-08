import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Database, Calculator, BarChart3, Lightbulb, HelpCircle } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { ExamplesTab } from './tabs/ExamplesTab';
import { TipsTab } from './tabs/TipsTab';
import { FAQTab } from './tabs/FAQTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

// Main component
export const DescriptiveAnalysis = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    {
      id: 'overview',
      label: 'Ringkasan',
      icon: BookOpen,
      component: OverviewTab
    },
    {
      id: 'variables',
      label: 'Variabel',
      icon: Database,
      component: VariablesTab
    },
    {
      id: 'statistics',
      label: 'Statistik',
      icon: Calculator,
      component: StatisticsTab
    },
    {
      id: 'examples',
      label: 'Contoh',
      icon: BarChart3,
      component: ExamplesTab
    },
    {
      id: 'tips',
      label: 'Tips',
      icon: Lightbulb,
      component: TipsTab
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: HelpCircle,
      component: FAQTab
    }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Analisis Deskriptif</h1>
        <p className="text-muted-foreground">
          Pelajari cara melakukan analisis statistik deskriptif untuk memahami karakteristik data Anda
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {tabConfig.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

export default DescriptiveAnalysis;
