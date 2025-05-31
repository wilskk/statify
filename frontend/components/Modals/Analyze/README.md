# Analyze Modal Components

This directory contains modal components for statistical analysis in the Statify application, organized into several categories:

- Descriptive Statistics (Descriptives, Frequencies, Explore, Crosstabs, Ratio, etc.)
- Compare Means (T-tests, ANOVA, etc.)
- Regression (Linear, Logistic, etc.)
- Classification (Discriminant, Cluster, etc.)
- Dimension Reduction (Factor Analysis, PCA, etc.)
- Time Series (ARIMA, Decomposition, etc.)
- Nonparametric Tests (Chi-Square, K Independent Samples, etc.)

## Architecture Integration

All analyze modals follow a consistent registry pattern:

1. **Category Registry**: Each analysis category has its own registry (e.g., `DescriptiveRegistry.tsx`), which:
   - Defines the component mappings for that category
   - Specifies container preferences (dialog vs. sidebar)
   - Provides helper functions for that category

2. **Central Analyze Registry**: `AnalyzeRegistry.tsx` aggregates all category registries:
   - Combines all modal component mappings
   - Merges container preferences
   - Provides a unified interface for the modal system

3. **Main Modal Registry**: `ModalRegistry.tsx` imports from the Analyze registry:
   - Integrates analysis modals into the main modal system
   - Applies consistent loading and error handling

## File Structure

```
components/Modals/
├── AnalyzeRegistry.tsx     # Central registry for all analysis modals
├── Analyze/
│   ├── index.ts            # Re-exports from AnalyzeRegistry and category registries
│   ├── README.md           # This documentation
│   │
│   ├── Descriptive/        # Descriptive statistics modals
│   │   ├── DescriptiveRegistry.tsx  # Registry for descriptive modals
│   │   ├── Descriptive/    # Basic descriptive statistics
│   │   ├── Frequencies/    # Frequency tables and charts
│   │   ├── Crosstabs/      # Cross-tabulation analysis
│   │   ├── Explore/        # Exploratory data analysis
│   │   ├── Ratio/          # Ratio statistics
│   │   ├── PPPlots/        # P-P plots
│   │   └── QQPlots/        # Q-Q plots
│   │
│   ├── CompareMeans/       # Mean comparison modals
│   ├── classify/           # Classification and clustering modals
│   ├── dimension-reduction/ # Dimension reduction modals
│   ├── general-linear-model/ # GLM modals
│   ├── NonparametricTests/ # Nonparametric test modals
│   └── TimeSeries/         # Time series modals
```

## Usage Example

To open an analyze modal from anywhere in the application:

```typescript
import { useModal, ModalType } from "@/hooks/useModal";

const { openModal } = useModal();

// Open a descriptive modal
openModal(ModalType.Descriptives);

// Open with props
openModal(ModalType.Frequencies, { initialSelectedVariables: ["age", "income"] });
```

## Registry Structure

Each category registry follows this pattern:

```typescript
// Import components directly or lazy-load them
import { ComponentA } from './ComponentA';
const ComponentB = lazy(() => import('./ComponentB'));

// Define component mappings
export const CATEGORY_MODAL_COMPONENTS = {
  [ModalType.TypeA]: ComponentA,
  [ModalType.TypeB]: withSuspense(ComponentB),
};

// Define container preferences
export const CATEGORY_MODAL_CONTAINER_PREFERENCES = {
  [ModalType.TypeA]: "sidebar",
  [ModalType.TypeB]: "dialog",
};

// Helper functions
export function getCategoryModalComponent(type) { /* ... */ }
```

## Best Practices

1. **Registry Pattern**:
   - Always register new modals in the appropriate category registry
   - Use the central analyze registry to aggregate categories

2. **Container Types**:
   - Simple forms work well in sidebar containers
   - Complex visualizations need dialog containers
   - Specify preferences in the category registry

3. **Lazy Loading**:
   - Use lazy loading for less-frequently used modals
   - Wrap lazy-loaded components with Suspense

4. **Type Safety**:
   - Ensure modal types are properly defined in `modalTypes.ts`
   - Use consistent prop interfaces for each modal category 