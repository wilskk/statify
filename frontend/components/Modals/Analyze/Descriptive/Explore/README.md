# Explore Modal - Implementation Plan

This document outlines the plan to implement the full functionality for the Explore analysis modal. The current implementation is a UI placeholder; this plan will connect it to the backend worker for real data analysis.

## Current State

- The UI is well-defined with three tabs: Variables, Statistics, and Plots.
- The component structure is in place (`index.tsx`, `VariablesTab.tsx`, etc.).
- State is managed directly in `index.tsx` using numerous `useState` hooks.
- The analysis logic in `handleExplore` is a placeholder that does not perform any calculations.
- The backend `ExamineCalculator` in the `DescriptiveStatistics` worker contains the necessary statistical logic but is not yet being used by this feature.

## Implementation Steps

### 1. State Management Refactoring
To improve code structure and maintainability, all state management will be extracted from `index.tsx` into custom hooks.

-   **`useVariableManagement.ts`**: Will manage the state and logic for variable selection (available, dependent, factor, and label lists).
-   **`useStatisticsSettings.ts`**: Will manage the state for all options in the "Statistics" tab (descriptives, confidence intervals, M-estimators, etc.).
-   **`usePlotsSettings.ts`**: Will manage the state for all options in the "Plots" tab (boxplot types, histograms, etc.).

### 2. Analysis Logic Implementation
A new central hook will be created to handle the entire analysis workflow.

-   **`useExploreAnalysis.ts`**:
    -   It will create and manage the web worker instance pointing to `/workers/DescriptiveStatistics/manager.js`.
    -   It will contain the primary `runAnalysis` function, which will be triggered when the user clicks "OK".
    -   **Factor Handling**: It will implement the crucial logic for grouping the dataset by the specified factor variables before sending data to the worker.
    -   It will iterate through each dependent variable and each factor-based data group, sending an `examine` analysis request to the worker for each combination.
    -   It will listen for results, process them, and format them into a structured object for output.
    -   It will use the `useResultStore` to save the log, the analysis, and the final results.

### 3. UI Component Updates
The main and tab components will be updated to consume the new hooks.

-   **`index.tsx`**: Will be refactored to use the new hooks, drastically reducing its internal complexity. The `handleExplore` and `handleReset` functions will be streamlined to call functions exposed by the hooks.
-   **`VariablesTab.tsx`**, **`StatisticsTab.tsx`**, **`PlotsTab.tsx`**: Will be updated to receive their state and handlers directly from the new hooks, removing prop-drilling.
-   **`types.ts`**: Will be updated to reflect the new hook-based architecture and define the structure for the analysis results.

### 4. Output Rendering
A new component will be created to display the results of the analysis.

-   **`ExploreOutput.tsx`**:
    -   This component will be responsible for rendering the complex, structured JSON output from the `useExploreAnalysis` hook.
    -   It will display descriptive statistics tables, M-Estimator results, percentile tables, and potentially placeholder sections for plots.
    -   It will be registered as the renderer for the `explore` analysis type.

This structured approach will result in a robust, maintainable, and powerful "Explore" feature that is well-integrated into the application's architecture.

# Explore Modal Component

The Explore modal provides a sophisticated interface for conducting exploratory data analysis on variables. It uses a structured tab-based approach to configure analysis options.

## Architecture

The component is built using the centralized modal architecture:

- **Container-agnostic**: Can be rendered in different containers (dialog or sidebar)
- **Direct registration pattern**: Registered directly in the modal registry
- **BaseModalProps**: Uses standardized props interface for consistency

## Components

1. **Main component (`index.tsx`)**: 
   - Entry point that adapts to container type
   - Manages overall modal state
   - Handles analysis execution and results

2. **Variables Tab**:
   - Manages variable selection using `VariableListManager`
   - Supports dependent variables, factor variables, and label variable selection

3. **Statistics Tab**:
   - Configures statistical calculation options
   - Controls descriptives, M-estimators, outliers, and percentile settings

4. **Plots Tab**:
   - Configures plot generation options
   - Manages boxplot type, stem-and-leaf plots, histograms, and normality plots

## Usage

The Explore component is designed to work with the central modal registry:

```tsx
// Register in ModalRegistry
import Explore from '@/components/Modals/Analyze/Descriptive/Explore';

ModalRegistry.register('explore', Explore);

// Use in application
openModal('explore', { 
  onClose: () => console.log('Modal closed'), 
  containerType: 'dialog' 
});
```

## Types

All component props are properly typed through interfaces in `types.ts`:

- `BaseModalProps`: Base props for modal components
- `HighlightedVariable`: Type for tracking highlighted variables
- `VariablesTabProps`: Props for the Variables tab
- `StatisticsTabProps`: Props for the Statistics tab
- `PlotsTabProps`: Props for the Plots tab
- `ExploreAnalysisParams`: Parameters passed to analysis functions
- `ExploreResults`: Structure for analysis results 