import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, BarChart3, Table, BookOpen } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { ChartsTab } from './tabs/ChartsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

export const Frequencies: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Ringkasan', icon: BookOpen },
    { value: 'variables', label: 'Variabel', icon: Table },
    { value: 'statistics', label: 'Statistik', icon: Calculator },
    { value: 'charts', label: 'Grafik', icon: BarChart3 }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Analisis Frekuensi</h1>
        <p className="text-muted-foreground">
          Pelajari cara membuat dan menginterpretasi tabel frekuensi untuk data Anda
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="variables" className="mt-6">
          <VariablesTab />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab />
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <ChartsTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

