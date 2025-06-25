# OpenSavFileModal Component

## Overview

The `OpenSavFileModal` component provides a user interface for selecting and opening SPSS statistics data files (`.sav` files). It allows users to either browse for a file or use drag-and-drop, then initiates the file processing.

## Features

-   **File Selection**: Users can select a `.sav` file using a standard file input or by dragging and dropping a file onto a designated area.
-   **File Validation**: Primarily checks for the `.sav` extension. Further validation might occur during processing.
-   **Selected File Display**: Shows the name and size of the selected file.
-   **Remove Selected File**: Allows users to clear the current file selection.
-   **Error Handling**: Displays errors related to file selection (e.g., wrong file type if explicitly checked before processing) or issues during the file processing/opening stage.
-   **Loading State**: Indicates when the file is being processed.
-   **Responsive Design**: Adapts to mobile and portrait orientations for better usability.

## Component Structure

The `OpenSavFileModal` (exported from `index.tsx`) wraps an internal step component (`OpenSavFileStep`). The overall logic, including file handling and processing initiation, is managed by the `useOpenSavFileLogic` hook.

-   `OpenSavFileStep`: Contains the UI for file selection (input, drag-and-drop area), displaying file information, errors, and action buttons (Cancel, Open).

## Component Props

The main `OpenSavFileModal` component accepts:

-   `onClose: () => void`: A mandatory function called when the modal should be closed (e.g., by clicking "Cancel" or after successful processing).
-   `containerType?: string`: (Optional, though often a required prop like `"dialog" | "sidebar"` in similar components) Specifies the rendering context, which might influence layout or styling.

Props for the internal `OpenSavFileStep` (managed by `OpenSavFileModal` via the hook):

-   `onClose: () => void`: To close the modal.
-   `onFileSelect: (file: File | null) => void`: Callback when a file is selected or cleared.
-   `onSubmit: () => Promise<void>`: Callback to initiate file processing.
-   `isLoading: boolean`: Indicates if processing is in progress.
-   `error: string | null`: Displays any error messages.
-   `selectedFile: File | null`: The currently selected file.
-   `isMobile: boolean`: Flag for mobile view.
-   `isPortrait: boolean`: Flag for portrait orientation.
-   `clearError: () => void`: Function to clear current errors.

## Usage

The `OpenSavFileModal` is typically used within a modal management system.

```tsx
import OpenSavFileModal from "./OpenSavFileModal"; // Adjust path as necessary

// Example:
const MyDataApplication = () => {
    const [isSavModalOpen, setIsSavModalOpen] = React.useState(false);

    const handleOpenSavFile = () => setIsSavModalOpen(true);
    const handleCloseSavFile = () => {
        setIsSavModalOpen(false);
        // Actions after modal closes or file is opened
    };

    return (
        <>
            <Button onClick={handleOpenSavFile}>Open .sav File</Button>
            {isSavModalOpen && (
                <OpenSavFileModal
                    onClose={handleCloseSavFile}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## Dependencies

-   React
-   `@/components/ui/button`
-   `@/components/ui/alert` (for `Alert`, `AlertDescription`)
-   `lucide-react` (icons: `Loader2`, `Upload`, `FileText`, `X`, `AlertCircle`, `FolderOpen`, `HelpCircle`)
-   `./hooks/useOpenSavFileLogic` (handles the core logic for file selection, processing, and state management)
-   `./types` (for `OpenSavFileProps`, `OpenSavFileStepProps`, `UseOpenSavFileLogicProps`, `UseOpenSavFileLogicOutput`)

## Structure within the Module

-   `index.tsx`: Contains the main `OpenSavFileModal` and the internal `OpenSavFileStep` component.
-   `types.ts`: Defines all TypeScript interfaces related to the component and its hook.
-   `hooks/`: Contains `useOpenSavFileLogic.ts`.
-   `services/`: May contain services for actual `.sav` file parsing if this logic is complex and separated (e.g., interacting with a backend or a WebAssembly SPSS reader).
-   `utils/`: May contain utility functions, for example, for specific client-side file checks or transformations if not part of the main hook/service. 