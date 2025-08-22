import type React from 'react';

// Import statistics components
import LinearityTest from './LinearityTest';
import HomoscedasticityTest from './HomoscedasticityTest';
import MulticollinearityTest from './MulticollinearityTest';

// Define the StatisticsComponentsRegistry interface
interface StatisticsComponentsRegistry {
  [key: string]: React.ComponentType<any>;
}

// Create a registry of statistics components mapped by name
export const StatisticsComponents: StatisticsComponentsRegistry = {
  // Add LinearityTest component
  LinearityTest,

  // Add HomoscedasticityTest component
  HomoscedasticityTest,

  // Add MulticollinearityTest component
  MulticollinearityTest,

};

// Function to get a component by name
export const getStatisticsComponent = (name: string): React.ComponentType<any> | null => {
  return StatisticsComponents[name] || null;
};

// Default export for convenience
export default StatisticsComponents;