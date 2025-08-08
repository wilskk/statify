import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Database, Table, Calculator, BarChart3, Zap } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { CellsTab } from './tabs/CellsTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

export const Crosstabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Analisis Crosstabs</h1>
        <p className="text-muted-foreground">
          Pelajari cara menganalisis hubungan antara variabel kategorikal menggunakan tabulasi silang
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="cells" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Cells
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Start
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="variables" className="mt-6">
          <VariablesTab />
        </TabsContent>

        <TabsContent value="cells" className="mt-6">
          <CellsTab />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab />
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <QuickStartGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

