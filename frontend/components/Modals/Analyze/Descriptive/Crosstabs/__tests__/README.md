# Crosstabs Modal Tests

This directory contains all tests for the Crosstabs modal component and its related hooks and utilities.

## Test Files

### 1. `Crosstabs.test.tsx`

- **Purpose**: Tests the main `Crosstabs` component's UI and user interactions.
- **Coverage**:
    - Renders the modal with its title and tabs.
    - Verifies that the "OK" and "Cancel" buttons trigger the correct `runAnalysis` and `onClose` callbacks.
    - Ensures tab switching functionality works as expected.
    - Tests variable list interactions, such as moving a variable to a target list on double-click and resetting the lists.
    - Confirms that the tour guide is initiated when the help button is clicked.

### 2. `useCrosstabsAnalysis.test.ts`

- **Purpose**: Tests the core analysis logic contained within the `useCrosstabsAnalysis` hook.
- **Coverage**:
    - Mocks the `Worker` and data stores (`useDataStore`, `useVariableStore`, `useResultStore`).
    - Ensures analysis is not triggered if required variables (row or column) are missing.
    - Verifies that the hook correctly calls the analysis worker with the right parameters.
    - Tests the successful processing of results from the worker, ensuring that log, analytic, and statistic entries are created.
    - Handles and reports errors from the analysis worker.
    - Simulates and tests worker instantiation errors.

### 3. `useTourGuide.test.ts`

- **Purpose**: Tests the interactive tour guide functionality provided by the `useTourGuide` hook.
- **Coverage**:
    - Mocks a DOM environment with the necessary element IDs for the tour steps.
    - Tests the tour's lifecycle: starting, stopping, moving to the next/previous step.
    - Verifies boundary conditions, ensuring the tour doesn't go below the first step or beyond the last one.
    - Tests the automatic tab-switching logic for tour steps that span across different tabs.
    - Confirms that the hook correctly identifies the target DOM element for each step.

### 4. `formatters.test.ts`

- **Purpose**: Tests the utility functions responsible for formatting the analysis results into display-ready tables.
- **Coverage**:
    - **`formatCaseProcessingSummary`**:
        - Ensures the summary table is generated with the correct title, headers, and data.
        - Verifies correct calculations for valid, missing, and total cases.
        - Handles edge cases like zero total cases.
    - **`formatCrosstabulationTable`**:
        - Ensures the main crosstabulation table is formatted correctly with dynamic headers based on variable categories.
        - Checks that the main data rows and the final "Total" row are structured and calculated properly.
        - Verifies that `null` is returned when result data is missing. 