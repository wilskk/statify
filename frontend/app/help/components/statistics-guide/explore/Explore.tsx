import React from 'react';
import { Calculator, BarChart3, Table, BookOpen } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { PlotsTab } from './tabs/PlotsTab';

const Explore = () => {
  const tabs = [
    {
      id: 'overview',
      label: 'Ringkasan',
      icon: BookOpen,
      component: OverviewTab
    },
    {
      id: 'variables',
      label: 'Variabel',
      icon: Table,
      component: VariablesTab
    },
    {
      id: 'statistics',
      label: 'Statistik',
      icon: Calculator,
      component: StatisticsTab
    },
    {
      id: 'plots',
      label: 'Grafik',
      icon: BarChart3,
      component: PlotsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Eksplorasi Data"
      description="Analisis statistik komprehensif dengan metode robust dan deteksi outlier"
      tabs={tabs}
      defaultTab="overview"
    >
      
    </StandardizedGuideLayout>
  );
};

export default Explore;
