import React from 'react';
import { BookOpen, Database, Table, Calculator } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { CellsTab } from './tabs/CellsTab';
import { StatisticsTab } from './tabs/StatisticsTab';
<<<<<<< HEAD
import { QuickStartGuide } from './tabs/QuickStartGuide';
=======
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export const Crosstabs: React.FC = () => {
  const tabs = [
    {
      id: 'overview',
<<<<<<< HEAD
      label: 'Overview',
=======
      label: 'Ringkasan',
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      icon: BookOpen,
      component: OverviewTab
    },
    {
      id: 'variables',
<<<<<<< HEAD
      label: 'Variables',
=======
      label: 'Variabel',
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      icon: Database,
      component: VariablesTab
    },
    {
      id: 'cells',
<<<<<<< HEAD
      label: 'Cells',
=======
      label: 'Sel',
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      icon: Table,
      component: CellsTab
    },
    {
      id: 'statistics',
<<<<<<< HEAD
      label: 'Statistics',
=======
      label: 'Statistik',
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      icon: Calculator,
      component: StatisticsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Analisis Crosstabs"
      description="Pelajari cara menganalisis hubungan antara variabel kategorikal menggunakan tabulasi silang"
      tabs={tabs}
      defaultTab="overview"
    >
<<<<<<< HEAD
      <QuickStartGuide />
=======
      
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    </StandardizedGuideLayout>
  );
};

