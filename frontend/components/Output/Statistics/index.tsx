import type React from 'react';
<<<<<<< HEAD
import dynamic from 'next/dynamic';

// Import statistics components
import LinearityTest from './LinearityTest';
import NormalityTest from './NormalityTest';
import HomoscedasticityTest from './HomoscedasticityTest';
import AutocorrelationTest from './AutocorrelationTest';
import NonautocorrelationTest from './NonautocorrelationTest';
import MulticollinearityTest from './MulticollinearityTest';
=======

// Import statistics components
import LinearityTest from './LinearityTest';
import HomoscedasticityTest from './HomoscedasticityTest';
import MulticollinearityTest from './MulticollinearityTest';
import GarchAnalysis from './GarchAnalysis';
import EcmAnalysis from './EcmAnalysis';
import ArdlAnalysis from './ArdlAnalysis';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

// Define the StatisticsComponentsRegistry interface
interface StatisticsComponentsRegistry {
  [key: string]: React.ComponentType<any>;
}

// Create a registry of statistics components mapped by name
<<<<<<< HEAD
export const StatisticsComponents: StatisticsComponentsRegistry = {
  // Add LinearityTest component
  LinearityTest,
  
  // Add NormalityTest component
  NormalityTest,
  
  // Add HomoscedasticityTest component
  HomoscedasticityTest,
  
  // Add AutocorrelationTest component
  AutocorrelationTest,
  
  // Add NonautocorrelationTest component
  NonautocorrelationTest,
  
  // Add MulticollinearityTest component
  MulticollinearityTest,
  
  // Add more components as they are created
  // 'MulticollinearityTest': MulticollinearityTest,
=======
// Create a registry of statistics components mapped by name
export const StatisticsComponents: StatisticsComponentsRegistry = {
  // Add LinearityTest component
  LinearityTest,

  // Add HomoscedasticityTest component
  HomoscedasticityTest,

  // Add MulticollinearityTest component
  MulticollinearityTest,

  // Add GarchAnalysis component
  GarchAnalysis,

  // Add EcmAnalysis component
  EcmAnalysis,

  // Add ArdlAnalysis component
  ArdlAnalysis,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
};

// Function to get a component by name
export const getStatisticsComponent = (name: string): React.ComponentType<any> | null => {
  return StatisticsComponents[name] || null;
};

// Default export for convenience
<<<<<<< HEAD
export default StatisticsComponents; 
=======
export default StatisticsComponents;
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
