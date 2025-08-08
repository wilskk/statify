import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calculator, BarChart3, TrendingUp, Table, Zap } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { PlotsTab } from './tabs/PlotsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

const Explore = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Eksplorasi Data</h1>
        <p className="text-muted-foreground">
          Analisis statistik komprehensif dengan metode robust dan deteksi outlier
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Variabel
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Statistik
          </TabsTrigger>
          <TabsTrigger value="plots" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Grafik
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

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab />
        </TabsContent>

        <TabsContent value="plots" className="mt-6">
          <PlotsTab />
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <QuickStartGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Explore;
