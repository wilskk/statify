// Re-export types and sub-components for easier imports
export * from './types';
export { default as VariablesTab } from './VariablesTab';
export { default as StatisticsTab } from './StatisticsTab';

// Re-export useful hooks for direct use by consumers
export { useVariableSelection } from './hooks/useVariableSelection';
export { useStatisticsSettings } from './hooks/useStatisticsSettings';
export { useDescriptivesAnalysis } from './hooks/useDescriptivesAnalysis';
export { useDataFetching } from './hooks/useDataFetching';
export { useDescriptivesWorker } from './hooks/useDescriptivesWorker'; 