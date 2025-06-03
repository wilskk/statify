# ExportCsv Component

The `ExportCsv` component provides a user interface for exporting data to a CSV (Comma Separated Values) file. It allows users to customize various export settings before generating the file.

## Features

- **File Name:** Specify a custom name for the exported CSV file.
- **Delimiter:** Choose the character used to separate values in the CSV file.
    - Comma (`,`)
    - Semicolon (`;`)
    - Pipe (`|`)
    - Tab (`\t`)
- **Include Headers:** Option to include variable names as the first row (header row) in the CSV file.
- **Include Variable Properties:** Option to include variable properties as the first row in the CSV file. (This appears to be distinct from headers, possibly for metadata).
- **Quote Strings:** Option to enclose all string values in quotes.
- **Encoding:** Select the character encoding for the CSV file.
    - UTF-8
    - UTF-16 LE
    - Windows-1252
- **Export Action:** Initiates the CSV export process with the selected options.
- **Close Action:** Closes the export dialog or interface.

## Component Props

The `ExportCsv` component accepts the following props:

- `initialFilename?: string`: (Optional) The initial value for the file name input.
- `initialDelimiter?: string`: (Optional) The initial delimiter to be selected. Defaults to comma (`,`) if not specified by the underlying `useExportCsv` hook.
- `initialIncludeHeaders?: boolean`: (Optional) The initial state for the "Include Headers" checkbox. Defaults to `true` if not specified by the underlying `useExportCsv` hook.
- `initialIncludeVariableProperties?: boolean`: (Optional) The initial state for the "Include Variable Properties" checkbox. Defaults to `false` if not specified by the underlying `useExportCsv` hook.
- `initialQuoteStrings?: boolean`: (Optional) The initial state for the "Quote Strings" checkbox. Defaults to `true` if not specified by the underlying `useExportCsv` hook.
- `initialEncoding?: string`: (Optional) The initial encoding to be selected. Defaults to `utf-8` if not specified by the underlying `useExportCsv` hook.
- `onClose: () => void`: A mandatory function to be called when the export interface is to be closed.
- `containerType?: "dialog" | "sidebar"`: (Optional) Specifies the type of container in which the component is rendered, which might affect its layout or behavior.

## Usage

This component is typically used within a modal or a sidebar to provide users with CSV export functionality. It relies on the `useExportCsv` hook to manage the state and logic of the export options and the export process itself.

```tsx
import ExportCsv from "./ExportCsv"; // Adjust path as necessary

// Example usage:
const MyPageComponent = () => {
    const handleCloseExport = () => {
        console.log("Export Csv dialog closed");
        // Logic to hide the export UI
    };

    return (
        <ExportCsv
            onClose={handleCloseExport}
            initialFilename="my_data_export"
            initialDelimiter=";"
            containerType="dialog"
        />
    );
};
```

## Dependencies

- React
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/checkbox`
- `@/components/ui/select`
- `@/components/ui/tooltip`
- `lucide-react` (for icons like `Loader2`, `InfoIcon`, `HelpCircle`)
- `../hooks/useExportCsv` (custom hook for export logic)
- `./types` (for `ExportCsvProps` and other related types)

## Structure

- `index.tsx`: Contains the main React component UI and logic.
- `types.ts`: Defines TypeScript interfaces for props and options.
- `hooks/`: Likely contains the `useExportCsv.ts` hook.
- `services/`: May contain services related to data fetching or processing for export (if any).
- `components/`: May contain sub-components used within `ExportCsv` (if any).
- `utils/`: May contain utility functions used by the component or its parts (if any). 