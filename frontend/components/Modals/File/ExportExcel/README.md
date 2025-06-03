# ExportExcel Component

The `ExportExcel` component provides a user interface for exporting data to an Excel file (either `.xlsx` or `.xls` format). It enables users to customize various export settings before generating the Excel workbook.

## Features

- **File Name:** Specify a custom name for the exported Excel file.
- **Format:** Choose the Excel file format:
    - XLSX (Excel Workbook)
    - XLS (Excel 97-2003 Workbook)
- **Options:** A range of checkboxes to control the content and styling of the Excel file:
    - **Include variable names as header row:** Adds a header row with variable names to the main data sheet.
    - **Include a separate sheet with variable properties:** Creates an additional sheet in the workbook detailing properties of each variable.
    - **Include a separate sheet with file metadata:** Adds another sheet containing metadata about the file or dataset.
    - **Write value labels instead of values:** For categorical variables, exports the descriptive labels instead of the underlying numerical or coded values.
    - **Apply basic styling to header row:** Adds basic formatting (e.g., bolding) to the header row if included.
- **Export Action:** Initiates the Excel export process with the selected options.
- **Cancel/Close Action:** Closes the export dialog or interface.

## Component Props

The `ExportExcel` component accepts the following props:

- `onClose: () => void`: A mandatory function that is called when the export interface is to be closed.
- `containerType?: "dialog" | "sidebar"`: (Optional) Specifies the type of container in which the component is rendered. This might influence its layout or behavior, and is typically passed down from a `ModalRenderer` or similar parent component.

*Note: The actual export logic, including management of `exportOptions` and `isExporting` state, is handled by the internal `useExportExcelLogic` hook.*

## Usage

This component is designed to be used within a modal or sidebar, offering users a way to configure and trigger Excel exports.

```tsx
import ExportExcel from "./ExportExcel"; // Adjust path as necessary

// Example usage:
const MyDataPage = () => {
    const handleCloseExcelExport = () => {
        console.log("Export Excel dialog closed");
        // Logic to hide the export UI
    };

    return (
        <ExportExcel
            onClose={handleCloseExcelExport}
            containerType="dialog"
        />
    );
};
```

## Dependencies

- React
- `@/components/ui/button`
- `@/components/ui/checkbox`
- `@/components/ui/label`
- `@/components/ui/input`
- `@/components/ui/select`
- `@/components/ui/tooltip`
- `lucide-react` (for icons like `Loader2`, `HelpCircle`)
- `./hooks/useExportExcelLogic` (custom hook for managing export state and logic)
- `./utils/constants` (for `EXCEL_FORMATS`, `EXCEL_OPTIONS_CONFIG`)
- `./types` (for `ExportExcelProps` and related TypeScript interfaces)

## Structure

- `index.tsx`: The main React component for the UI.
- `types.ts`: TypeScript definitions for props, state, and options.
- `hooks/`: Contains `useExportExcelLogic.ts` which encapsulates the business logic.
- `utils/`: Contains `constants.ts` defining available Excel formats and configuration for checkbox options. May also include other utility functions.
- `services/`: Potentially for services related to data preparation or the actual Excel file generation, if not handled directly in the hook or a utility.
- `components/`: Could house sub-components if the UI were more complex, though in the current structure, most UI elements are directly in `index.tsx`. 