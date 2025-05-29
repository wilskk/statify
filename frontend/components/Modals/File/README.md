# File Modal Components

This directory contains modal components for file operations in the Statify application, including:
- Importing data (CSV, Excel)
- Exporting data (CSV, Excel)
- Opening files (SAV format)
- Printing to PDF

## Architecture Integration

All file modals integrate with the main modal architecture using these components:

1. **Container Component** (e.g., `ExportCsvContainer.tsx`)
   - Manages dialog vs. sidebar rendering
   - Uses custom hook for business logic
   - Renders UI component with appropriate container

2. **UI Component** (e.g., `ExportCsv.tsx`) 
   - Pure presentational component
   - Renders form fields, controls, preview, etc.
   - Receives callbacks from container

3. **Custom Hook** (e.g., `useExportCsv.ts`)
   - Contains all business logic
   - Manages state
   - Handles file operations
   - Returns all necessary data and handlers

4. **Common Template**
   - `FileModalTemplate.tsx` provides consistent styling
   - Automatically handles dialog/sidebar rendering

## File Structure

```
components/Modals/File/
├── FileModalTemplate.tsx     # Shared template component
├── index.ts                  # Exports all components
├── README.md                 # This documentation
│
├── ImportCsv/                # CSV import components
│   ├── ImportCsv.tsx           # Main UI component
│   ├── ImportCsvContainer.tsx  # Container component
│   ├── ImportCsvSelection.tsx  # Step component for file selection
│   ├── ImportCsvConfiguration.tsx  # Step component for configuration
│   ├── useImportCsvFileReader.ts   # Hook for file reading
│   ├── useImportCsvProcessor.ts    # Hook for CSV processing
│   ├── index.ts              # Export main components
│   └── utils/                # Utility functions
│
├── ExportCsv/                # Similar structure for CSV export
├── ImportExcel/              # Similar structure for Excel import
├── ExportExcelModal/         # Similar structure for Excel export
├── OpenSavFile/              # Similar structure for opening SAV files
└── Print/                    # Similar structure for print functionality
```

## Registration in Modal System

All file modals are registered in the central modal system through:

1. **Type Definition** (`modalTypes.ts`):
   ```typescript
   export enum ModalType {
     ImportCSV = "ImportCSV",
     ExportCSV = "ExportCSV",
     // etc.
   }
   ```

2. **Component Registry** (`ModalRegistry.tsx`):
   - File modals are registered in `FILE_MODAL_COMPONENTS`
   - Container preferences in `MODAL_CONTAINER_PREFERENCES`

## Usage Example

To open a file modal from anywhere in the application:

```typescript
import { useModal, ModalType } from "@/hooks/useModal";

const { openModal } = useModal();

// Open a file modal
openModal(ModalType.ExportCSV);

// With props
openModal(ModalType.ExportCSV, { initialFilename: "my-data" });

// Override container type
openModal(ModalType.ExportCSV, { containerOverride: "dialog" });
```

## Best Practices

1. **Container/UI Separation**
   - Keep container components minimal - only for container logic
   - Put all UI elements in UI component
   - Business logic goes in hooks

2. **Step-Based Approach**
   - For complex workflows, use step components
   - Define clear step progression
   - Manage step state in container or hook

3. **Progressive Enhancement**
   - Start with minimal functionality
   - Add features and options incrementally
   - Test thoroughly between additions 