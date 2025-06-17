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