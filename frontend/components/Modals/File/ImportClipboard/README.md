# ImportClipboardModal Component

## Overview

The `ImportClipboardModal` component enables users to import tabular data into the application by pasting it directly from their clipboard. It functions similarly to Excel's "Text to Columns" feature, providing a two-step process: pasting the data and then configuring how it should be parsed and imported.

## Features

-   **Paste Data**: Allows users to paste text directly into a designated area. The component can also attempt to read from the clipboard API automatically.
-   **Configure Parsing Options**: After pasting, users can specify how the text data should be interpreted:
    -   **Delimiter**: Choose the character that separates values (e.g., Tab, Comma, Semicolon, Space, or a custom delimiter).
    -   **First Row as Headers**: Option to treat the first row of the pasted data as column headers/variable names.
    -   **Trim Whitespace**: Automatically remove leading/trailing whitespace from data cells.
    -   **Skip Empty Rows**: Option to ignore rows that are entirely empty.
    -   **Detect Data Types**: Attempt to automatically infer the data type (e.g., number, string, date) for each column.
-   **Data Preview**: (Handled within `ImportClipboardConfigurationStep`) Provides an interactive preview (typically using a table component like Handsontable) of how the data will look based on the selected parsing options.
-   **Import Data**: Finalizes the import process, transforming the pasted text into structured data and variables for use within the application.

## Workflow Stages

The import process is divided into two main stages, handled by distinct sub-components:

1.  **Paste Data (`ImportClipboardPasteStep.tsx`)**
    -   The initial step where the user pastes their data or it's read from the clipboard.
    -   Handles loading states and any errors during the paste or initial read process.
    -   User proceeds to the configuration step once text is provided.

2.  **Configure Import (`ImportClipboardConfigurationStep.tsx`)**
    -   This step allows the user to define parsing options (delimiter, headers, etc.).
    -   Displays a preview of the data based on the current settings.
    -   Handles the final import action, which processes the data according to the configuration and integrates it into the application's data stores.

## Component Props

The `ImportClipboardModal` component, as defined in `index.tsx`, accepts the following props:

-   `onClose: () => void`: A mandatory function that is called when the import modal is to be closed (e.g., by clicking a "Close" or "Cancel" button, or after successful import).
-   `containerType?: "dialog" | "sidebar"`: (Optional) Specifies the type of container in which the component is rendered (e.g., as a full dialog or within a sidebar). This can affect styling or layout.

## Usage

The `ImportClipboardModal` is typically rendered as part of a modal system.

```tsx
import ImportClipboardModal from "./ImportClipboardModal"; // Or specific path to index.tsx

// Example:
const MyPageWithImport = () => {
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

    const handleOpenImportModal = () => setIsImportModalOpen(true);
    const handleCloseImportModal = () => {
        setIsImportModalOpen(false);
        // Additional logic after modal closes, e.g., refresh data
    };

    return (
        <>
            <Button onClick={handleOpenImportModal}>Import from Clipboard</Button>
            {isImportModalOpen && (
                <ImportClipboardModal
                    onClose={handleCloseImportModal}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## Architecture & Structure

The module is organized as follows:

```
ImportClipboard/
├── components/
│   ├── ImportClipboardPasteStep.tsx      # UI and logic for the data pasting step
│   └── ImportClipboardConfigurationStep.tsx # UI and logic for data configuration and preview
├── hooks/
│   ├── useImportClipboardLogic.ts        # Manages overall modal state, navigation between steps, initial paste handling
│   └── useImportClipboardProcessor.ts    # Handles advanced parsing, data transformation, and final import (likely used by ConfigurationStep)
├── services/
│   └── services.ts                     # For external interactions, e.g., Clipboard API access
├── utils/
│   └── utils.ts                        # Core parsing utilities, data type detection, etc.
├── index.tsx                             # Main modal container component, orchestrates steps
├── README.md                             # This documentation file
└── types.ts                              # TypeScript interfaces for props, state, and options
```

## Internal Logic Highlights

-   **State Management**: The `useImportClipboardLogic` hook manages the current stage (`paste` or `configure`), pasted text, loading states, and errors.
-   **Parsing Core**: The actual text-to-columns parsing is primarily handled by utility functions within `utils/utils.ts` (e.g., a function like `excelStyleTextToColumns` as described in previous documentation). This logic supports various delimiters, text qualifiers (implicitly, by handling quoted strings), and options like trimming whitespace and skipping empty rows.
-   **Data Processing**: The `useImportClipboardProcessor` hook (likely utilized by `ImportClipboardConfigurationStep`) orchestrates the use of these parsing utilities based on user configuration, generates a preview, and handles the final creation of variables and data to be loaded into application stores.
-   **Clipboard Interaction**: `services/services.ts` encapsulates the browser's Clipboard API (`navigator.clipboard.readText()`) for fetching pasted content, including permission handling.
-   **Error Handling**: Errors from clipboard operations, parsing, or data processing are caught and displayed to the user, typically within the relevant step.

## Dependencies

Key dependencies include:

-   React
-   Internal hooks: `useImportClipboardLogic`, `useImportClipboardProcessor`
-   Internal components: `ImportClipboardPasteStep`, `ImportClipboardConfigurationStep`
-   Internal services: for clipboard access
-   Internal utilities: for parsing and data manipulation
-   Potentially UI component libraries (e.g., `@/components/ui/*`) used within the step components.
-   Potentially a table library (e.g., Handsontable) for the data preview in `ImportClipboardConfigurationStep`. 