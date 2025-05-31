# Data Modal Components

The Data modal components provide interfaces for data manipulation, variable configuration, and related operations in the application. These components follow the centralized modal architecture pattern for consistency across the application.

## Architecture

The components are built using the centralized modal architecture:

- **Container-agnostic**: Each modal can be rendered in different containers (dialog or sidebar)
- **Direct registration pattern**: All modals are registered directly in the central modal registry
- **BaseModalProps**: Components use standardized props interface for consistency

## Component Structure

The data modal components are organized into the following categories:

1. **Variable Properties**
   - DefineVarProps: Define and modify variable properties
   - SetMeasurementLevel: Set or change measurement levels for variables
   - DefineDateTime: Configure date and time formats

2. **Case Operations**
   - SortCases: Sort cases based on variable values
   - DuplicateCases: Identify and manage duplicate cases
   - UnusualCases: Find and handle unusual cases in the dataset
   - WeightCases: Apply weighting to cases

3. **Structure Operations**
   - SortVars: Reorder variables in the dataset
   - Transpose: Transpose the data matrix
   - Restructure: Change the structure of the dataset
   - Aggregate: Aggregate data based on grouping variables

4. **Validation**
   - DefineValidationRules: Create and manage data validation rules

## Organization

The data modal components are organized with the following structure:

```
Data/
├── DataRegistry.tsx     # Central registry for data modals
├── index.ts            # Exports all components
├── README.md           # Documentation
├── DataMenu.tsx        # Menu component for data operations
└── [Component]/        # Individual component directories
```

## Usage

Data modals can be accessed through:

1. The Data menu in the main application menubar
2. Direct programmatic access via the modal hook:

```tsx
import { ModalType, useModal } from "@/hooks/useModal";

// In your component
const { openModal } = useModal();

// Open a data modal
openModal(ModalType.DefineVarProps);
```

## Container Preferences

Most data modals work best as sidebars due to their complex forms and selection lists. The container preferences are defined in `DataRegistry.tsx` and can be overridden when opening a modal if needed. 