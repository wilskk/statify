# ImportExcelModal Component

## Overview

The `ImportExcelModal` component enables users to import data from Excel files (e.g., `.xlsx`, `.xls`). The process involves two main steps: selecting an Excel file from their local system, and then configuring how a specific sheet within that file should be parsed and imported.

## Features

-   **File Selection (`ImportExcelSelectionStep`)**:
    -   Allows users to browse and select a local Excel file.
    -   Displays the name of the selected file.
    -   Handles reading the file (as binary content) and shows loading states or errors during this phase.
-   **Sheet & Parsing Configuration (`ImportExcelConfigurationStep`)**:
    -   After the file is loaded, users can typically select which sheet from the Excel workbook they want to import.
    -   **Data Range**: Option to specify a specific cell range to import from the selected sheet (e.g., "A1:D10").
    -   **First Line Contains Headers**: Option to treat the first row of the selected range/sheet as column headers (variable names).
    -   **Read Hidden Rows/Columns**: Option to include data from hidden rows or columns.
    -   **Handle Empty Cells**: Define how empty cells are treated (e.g., as empty strings or a specific missing value indicator).
    -   (Likely) A preview of the data from the selected sheet and range based on current parsing options.
-   **Import Data**: Finalizes the import process using the configured options for the chosen sheet.
-   **Navigation**: Allows users to go back from the configuration step to the file selection step.

## Workflow Stages

The component operates in two main stages, managed by `useImportExcelLogic`:

1.  **Select File (`select`)**:
    -   Handled by the `ImportExcelSelectionStep` sub-component.
    -   User selects an Excel file.
    -   The hook reads the file as binary content.
    -   Transitions to the `configure` stage upon successful file read.

2.  **Configure Sheet & Parsing (`configure`)**:
    -   Handled by the `ImportExcelConfigurationStep` sub-component.
    -   The binary content of the file is passed to this stage.
    -   Users select a sheet (if multiple exist) and configure parsing options defined in `ParseSheetOptions` (from `types.ts`).
    -   A data preview is typically available.
    -   Users can initiate the import or navigate back.

## Component Props

The main `ImportExcelModal` component (from `index.tsx`) accepts:

-   `onClose: () => void`: Mandatory function called to close the modal.
-   `containerType: "dialog" | "sidebar"`: Mandatory prop specifying the rendering context.

## Usage

Embed `ImportExcelModal` within a modal management system.

```tsx
import ImportExcelModal from "./ImportExcelModal"; // Adjust path

// Example:
const MyDataPage = () => {
    const [showImportExcel, setShowImportExcel] = React.useState(false);

    const handleOpen = () => setShowImportExcel(true);
    const handleClose = () => {
        setShowImportExcel(false);
        // Post-import actions
    };

    return (
        <>
            <Button onClick={handleOpen}>Import from Excel</Button>
            {showImportExcel && (
                <ImportExcelModal
                    onClose={handleClose}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## Dependencies

-   React
-   `./components/ImportExcelSelectionStep.tsx`
-   `./components/ImportExcelConfigurationStep.tsx`
-   `./hooks/useImportExcelLogic.ts` (manages state, file reading, stage transitions)
-   `./types.ts` (for `ImportExcelProps`, `ParseSheetOptions`, etc.)
-   `@/types/ui` (for `ContainerType`)
-   (Likely) UI component libraries like `@/components/ui/button`, `@/components/ui/input`, etc., used within the step components.
-   (Likely) An Excel parsing library (e.g., SheetJS/xlsx) used within the hooks or configuration step to read and process `.xlsx`/`.xls` files.

## Structure

-   `index.tsx`: Main `ImportExcelModal` component, orchestrates the steps.
-   `types.ts`: TypeScript interfaces for props, options (`ParseSheetOptions`), and data structures.
-   `components/`:
    -   `ImportExcelSelectionStep.tsx`: UI/logic for file selection.
    -   `ImportExcelConfigurationStep.tsx`: UI/logic for sheet selection, parsing configuration, and data preview.
-   `hooks/`:
    -   `useImportExcelLogic.ts`: Handles overall modal logic, file reading, state management.
    -   (Potentially) Other hooks for specific tasks like sheet parsing if `useImportExcelLogic` becomes too large.
-   `utils/`:
    -   (Potentially) Utility functions for Excel data processing, interacting with the parsing library.
-   `services/`: (Less likely for Excel import unless interacting with a backend for processing, but possible). 