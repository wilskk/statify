import React from 'react';
<<<<<<< HEAD
import { Calculator, BarChart3, Table } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { PlotsTab } from './tabs/PlotsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';
=======
import { Calculator, BarChart3, Table, BookOpen } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { PlotsTab } from './tabs/PlotsTab';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

const Explore = () => {
  const tabs = [
    {
<<<<<<< HEAD
=======
      id: 'overview',
      label: 'Ringkasan',
      icon: BookOpen,
      component: OverviewTab
    },
    {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
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
<<<<<<< HEAD
      defaultTab="variables"
    >
      <QuickStartGuide />
=======
      defaultTab="overview"
    >
      
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    </StandardizedGuideLayout>
  );
};

export default Explore;
