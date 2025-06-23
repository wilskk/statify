# Define Variable Properties Feature

This document describes the functionality and architecture of the "Define Variable Properties" feature, a two-step modal designed for detailed variable configuration based on scanned data.

## 1. Overview

The "Define Variable Properties" feature is a powerful tool that allows users to inspect their data and define or correct metadata for multiple variables in a single, streamlined workflow. It operates in two distinct steps:

1.  **Scanning**: The user selects a set of variables from their dataset and specifies limits for the scanning process. This step is crucial for gathering the necessary information from the raw data.
2.  **Editing**: Based on the scanned data, the feature presents a rich editor where the user can modify properties for each selected variable, including its name, label, type, measurement level, value labels, and missing value specifications.

The primary goal is to provide an efficient way to enhance data quality and ensure metadata accuracy, which is fundamental for reliable analysis.

## 2. Feature Architecture

The feature is architecturally divided to handle the complexity of its two-step nature, following the project's standard `feature-sliced` principles.

-   **`index.tsx`**: The main entry point that acts as a simple state machine, rendering either the `VariablesToScan` or `PropertiesEditor` component based on the current step.
-   **`VariablesToScan.tsx`**: The UI component for the first step (variable selection and scan limits).
-   **`PropertiesEditor.tsx`**: The UI component for the second step, containing the detailed variable editor with a Handsontable grid for value labels.
-   **`hooks/useDefineVarProps.ts`**: A simple hook that manages the transition between the "scan" and "editor" steps.
-   **`hooks/useVariablesToScan.ts`**: Manages the state and logic for the `VariablesToScan` component, including variable lists and limit settings.
-   **`hooks/usePropertiesEditor.ts`**: The central orchestrator for the `PropertiesEditor`. It manages the state of the currently selected variable, UI interactions (like dropdowns), and coordinates calls to the service layer.
-   **`services/variablePropertiesService.ts`**: Contains the core, non-UI business logic.
    -   It exposes functions to scan the data (`getUniqueValuesWithCounts`), analyze it (`suggestMeasurementLevel`), and save changes (`saveVariableProperties`).
    -   These functions interact with the global data stores (`useDataStore`, `useVariableStore`) but are decoupled from the React component lifecycle, making them pure and testable.
-   **`utils/typeFormatters.ts`**: Contains pure helper functions for formatting text for the UI.
-   **`constants/dateSpecs.ts`**: Holds constant definitions, specifically the detailed specifications for various date formats (`DATE_FORMAT_SPECS`).
-   **`types.ts`**: Defines all TypeScript interfaces specific to this feature.

## 3. Data and Workflow

The feature's workflow is sequential and designed to guide the user through the process logically.

1.  **Step 1: Variable Selection**
    -   The user is presented with a list of available variables.
    -   They move the desired variables into a "Variables to Scan" list.
    -   They can set limits on how many cases (rows) to scan and how many unique values to display per variable. This is critical for performance with large datasets.
    -   Clicking "Continue" passes the selected variables and limits to the next step.

2.  **Step 2: Property Editing**
    -   The `PropertiesEditor` component is displayed.
    -   The `usePropertiesEditor` hook calls the `getUniqueValuesWithCounts` function from the service to populate the "Value Labels" grid for the first selected variable.
    -   **Editing Properties**: The user can modify standard properties like Label, Measurement Level, Role, and Type.
    -   **Measurement Suggestion**: A "Suggest Measurement Level" button is available. When clicked, it calls the `suggestMeasurementLevel` service function, which analyzes the variable's data (e.g., checks for non-numeric values, counts unique values) and returns a suggested level (Nominal, Ordinal, or Scale) with an explanation.
    -   **Value Labels Grid**: A Handsontable grid displays the unique values found during the scan, their frequencies (Count), and allows the user to assign a text `Label` to each `Value`. Users can also mark specific values as `Missing`.
    -   **Saving**: When the user clicks "OK", the `handleSave` function in the hook is triggered. It calls the `saveVariableProperties` service function, which efficiently detects only the variables that have changed and applies the updates to the global `variableStore`.

This two-step process ensures that the editor is populated with relevant, data-driven information, making the task of defining properties both faster and more accurate. 