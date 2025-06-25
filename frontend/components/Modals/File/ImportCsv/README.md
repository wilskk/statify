# ImportCsv Component

## Overview

The `ImportCsv` component facilitates importing data from CSV (Comma Separated Values) files. It guides the user through a two-step process: selecting a CSV file and then configuring parsing options before the data is imported into the application.

## Features

-   **File Selection (`ImportCsvSelection` step)**:
    -   Allows users to browse and select a local CSV file.
    -   Displays the name of the selected file.
    -   Handles file reading and shows loading states or errors during this phase.
-   **Parsing Configuration (`ImportCsvConfiguration` step)**:
    -   Once the file is read, users can specify how the CSV data should be interpreted.
    -   **First Line Contains Headers**: Option to treat the first line of the CSV as column headers (variable names).
    -   **Trim Whitespace**: Options to remove leading and/or trailing whitespace from data cells.
    -   **Delimiter**: Choose the character separating values (e.g., comma, semicolon, tab).
    -   **Decimal Separator**: Specify the character used for decimal points in numbers (e.g., period, comma).
    -   **Text Qualifier**: Define the character used to enclose text strings that may contain delimiters (e.g., double quote, single quote).
    -   (Likely) A preview of the parsed data based on selected options.
-   **Import Data**: Finalizes the import process based on the configuration.
-   **Navigation**: Allows users to go back from the configuration step to the file selection step.

## Workflow Stages

The component operates in two main stages:

1.  **Select File (`select`)**:
    -   Managed by the `ImportCsvSelection` sub-component.
    -   User selects a `.csv` file from their local system.
    -   The `useImportCsvFileReader` hook is used to read the file content.
    -   Upon successful file read, the component transitions to the configuration stage.

2.  **Configure Parsing (`configure`)**:
    -   Managed by the `ImportCsvConfiguration` sub-component.
    -   The content of the selected file is passed to this stage.
    -   User adjusts various parsing options as defined in `CSVProcessingOptions` (`types.ts`).
    -   (Typically) A preview of the data is shown, updating as options change.
    -   User can initiate the final import or go back to re-select a file.

## Component Props

The `ImportCsv` main component accepts the following props:

-   `onClose: () => void`: A mandatory function called when the import modal should be closed.
-   `containerType: "dialog" | "sidebar"`: Specifies the rendering context (e.g., dialog or sidebar), influencing layout or behavior. This prop is mandatory.

## Usage

The `ImportCsv` component is designed to be embedded within a modal or a similar container managed by a parent component (e.g., `ModalRenderer`).

```tsx
import ImportCsv from "./ImportCsv"; // Adjust path as necessary

// Example usage:
const MyDataManagementPage = () => {
    const [isImportCsvModalOpen, setIsImportCsvModalOpen] = React.useState(false);

    const handleOpenImportCsv = () => setIsImportCsvModalOpen(true);
    const handleCloseImportCsv = () => {
        setIsImportCsvModalOpen(false);
        // Optional: refresh data or perform other actions
    };

    return (
        <>
            <Button onClick={handleOpenImportCsv}>Import CSV File</Button>
            {isImportCsvModalOpen && (
                <ImportCsv
                    onClose={handleCloseImportCsv}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## Dependencies

-   React
-   `@/components/ui/dialog` (likely for `DialogHeader`, `DialogTitle`, etc., used within sub-components or if not fully abstracted by `ModalRenderer`)
-   `@/components/ui/button`
-   `lucide-react` (for icons like `ArrowLeft`)
-   `./components/ImportCsvSelection.tsx`
-   `./components/ImportCsvConfiguration.tsx`
-   `./hooks/useImportCsvFileReader.ts` (for reading file content)
-   `./types.ts` (for `CSVProcessingOptions` and other related types)
-   `@/types/ui` (for `ContainerType`)

## Structure

-   `index.tsx`: The main `ImportCsv` component that orchestrates the two stages (`select` and `configure`).
-   `types.ts`: Defines TypeScript interfaces, primarily `CSVProcessingOptions`.
-   `components/`:
    -   `ImportCsvSelection.tsx`: UI and logic for the file selection step.
    -   `ImportCsvConfiguration.tsx`: UI and logic for configuring CSV parsing options and previewing data.
-   `hooks/`:
    -   `useImportCsvFileReader.ts`: Custom hook to handle asynchronous file reading and manage related state (content, loading, errors).
-   `services/`: (Potentially) If there are specific service calls for CSV processing beyond client-side parsing.
-   `utils/`: For utility functions related to CSV parsing or data transformation if not handled within hooks or components directly.

## Web Worker Integration

-   **csvWorker.js**: Located at `public/workers/file-management/csvWorker.js`, handles CSV parsing off the main thread to keep UI responsive.
-   **Service**: `services/services.ts` exports `parseCsvWithWorker(fileContent, options)` and `ProcessedCsvData` type to interact with the worker.
-   **Hook**: `hooks/useCsvWorker.ts` wraps `parseCsvWithWorker`, providing `parse`, `isProcessing`, and `error` state for components.

## Updated Structure

-   `public/workers/file-management/csvWorker.js`: Web Worker script for CSV parsing.
-   `services/services.ts`: Includes `importCsvDataService` and `parseCsvWithWorker`.
-   `hooks/useImportCsvFileReader.ts`: Reads raw file content.
-   `hooks/useCsvWorker.ts`: Manages worker parsing.
-   `hooks/useImportCsvProcessor.ts`: Populates stores via service using worker-parsed data.

# End of README