# Define Dates Feature

This document outlines the functionality and architecture of the "Define Dates" feature, which allows users to create a time-based structure for their dataset.

## 1. Overview

The "Define Dates" feature provides a user-friendly interface to establish a chronological framework for time-series data. When a user selects a predefined date and time format (e.g., "Years, quarters, months"), this module automatically:

1.  **Creates New Variables**: Generates a separate variable for each time component specified in the format (e.g., `YEAR_`, `QUARTER_`, `MONTH_`).
2.  **Generates a Formatted Date Variable**: Creates a single string variable named `DATE_` that displays the complete, formatted date entry for each case.
3.  **Populates with Sample Data**: Fills the newly created variables with sequential date and time values for the first 20 rows (or the total number of existing rows if less than 20) to provide an immediate visual representation of the structure.
4.  **Stores Metadata**: Saves the chosen date format configuration in the application's metadata, allowing other time-series features to recognize and utilize this structure.

## 2. Feature Architecture

The feature follows the standard modal architecture, separating concerns into hooks, services, and utils.

-   **`index.tsx`**: The main entry point for the modal. It assembles the UI and is responsible for rendering the content.
-   **`hooks/useDefineDateTime.ts`**: The central orchestrator for the feature's logic. It manages the UI state (like the currently selected date format), handles user interactions (button clicks), and coordinates calls between the service and the global stores.
-   **`services/dateTimeService.ts`**: Contains the core business logic. Its primary responsibility is to prepare the definitions for the new variables and generate the corresponding cell data. It is a pure module that does not directly interact with global stores, making it highly testable.
-   **`utils/dateTimeFormatters.ts`**: A collection of pure, reusable utility functions for parsing user selections and formatting date/time strings for display.
-   **`types.ts`**: Defines the TypeScript types and interfaces specific to this feature, such as `TimeComponent`.

## 3. Data Flow

The data processing flow is designed to be clear and maintainable:

1.  **User Interaction**: The user selects a desired date format from the "Cases Are" list (e.g., "Days, hours").
2.  **State Update**: The `useDefineDateTime` hook updates its internal state to reflect this selection. The UI re-renders to show the relevant input fields for the "First Case Is" section.
3.  **Confirmation**: The user clicks the "OK" button.
4.  **Hook Orchestration**: The `handleOk` function within the hook is triggered.
5.  **Service Call**: The hook calls the `prepareDateVariables` function from `dateTimeService.ts`, passing the current time components, the list of existing variables, and the number of rows in the dataset.
6.  **Logic Execution**: The service function:
    -   Calculates the required new variables (`YEAR_`, `DAY_`, `HOUR_`, `DATE_`, etc.).
    -   Generates the sequential sample data for each new variable.
    -   Returns a single object containing two arrays: `variablesToCreate` and `cellUpdates`.
7.  **Store Interaction**: The `handleOk` function in the hook receives this object and performs the following actions in sequence:
    -   It iterates through the `variablesToCreate` array, calling the `addVariable` action from the `useVariableStore` for each new variable.
    -   It calls the `updateCells` action from the `useDataStore`, passing the entire `cellUpdates` array to populate the grid in a single, efficient operation.
    -   It updates the `useMetaStore` with the selected date format string.
8.  **Modal Close**: The modal closes, and the user sees the newly created and populated variables in the main data grid.

## 4. Available Date & Time Components

The feature supports a wide range of time component combinations, which are defined in the `casesAreOptions` array in the hook. Each selection maps to a set of time components with specific properties:

-   **Component**: Year, Quarter, Month, Week, Day, Hour, Minute, Second.
-   **Work-Specific Components**: "Work day" and "Work hour" are special components with predefined periodicities (e.g., 5 or 6 days a week, 8 hours a day).
-   **Periodicity**: This value defines the cyclical nature of a component within a larger component (e.g., a `Month` has a periodicity of 12 within a `Year`, an `Hour` has a periodicity of 24 within a `Day`). Components without a defined cycle (like `Year`) have no periodicity. This is crucial for calculating how time increments across cases. 