# Crosstabs Modal Component

The Crosstabs modal provides a focused interface for creating cross-tabulation analyses. It features a tab-based approach that allows users to specify variables and cell display options.

## Architecture

The component is built using the centralized modal architecture:

- **Container-agnostic**: Can be rendered in different containers (dialog or sidebar)
- **Direct registration pattern**: Registered directly in the modal registry
- **BaseModalProps**: Uses standardized props interface for consistency

## Components

1. **Main component (`index.tsx`)**: 
   - Entry point that adapts to container type
   - Manages overall modal state and variable selections
   - Handles analysis execution and results

2. **Variables Tab**:
   - Manages variable selection for row and column variables
   - Supports drag-and-drop and double-click interactions

3. **Cells Tab**:
   - Controls cell display options: counts, percentages, residuals
   - Manages Z-test options and noninteger weight handling

## Usage

The Crosstabs component is designed to work with the central modal registry:

```tsx
// Register in ModalRegistry
import Crosstabs from '@/components/Modals/Analyze/Descriptive/Crosstabs';

ModalRegistry.register('crosstabs', Crosstabs);

// Use in application
openModal('crosstabs', { 
  onClose: () => console.log('Modal closed'), 
  containerType: 'dialog' 
});
```

## Types

All component props are properly typed through interfaces in `types.ts`:

- `BaseModalProps`: Base props for modal components
- `VariableHighlight`: Type for tracking highlighted variables
- `NonintegerWeightsType`: Type for noninteger weights options
- Component-specific props interfaces:
  - `VariablesTabProps`
  - `CellsTabProps`
- `CrosstabsAnalysisParams`: Parameters passed to analysis functions 