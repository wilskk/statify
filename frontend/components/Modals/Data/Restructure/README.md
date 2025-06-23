# Restructure Data Wizard

## 1. Overview

This component provides a user-friendly, multi-step wizard for restructuring datasets, analogous to the **Restructure Data Wizard** found in statistical software like SPSS. It allows users to transform data between "wide" and "long" formats, or transpose the entire dataset.

The entire restructuring process is handled on the **frontend**. The wizard guides the user through specifying the transformation, and upon completion, the logic is executed by a client-side service which then updates the application's state with the newly structured data and variables.

## 2. Component Architecture

The feature is architecturally divided into several key files to separate concerns:

-   **`index.tsx`**: The main entry point that integrates the UI (`RestructureUI`) with the state management and logic from the `useRestructure` hook.
-   **`RestructureUI.tsx`**: A presentational component responsible for rendering the wizard's tab-based user interface. It is driven entirely by the state and handlers provided by the `useRestructure` hook.
-   **`useRestructure.ts`**: The logical core of the component. This custom hook manages the wizard's state, including the current step, selected method, variable lists, user-selected options, and input validation. It orchestrates the entire process.
-   **`restructureService.ts`**: This is the service layer that contains the pure data transformation logic. It receives the current data, variables, and a configuration object from the hook, performs the restructuring, and returns the new data and variable definitions.
-   **`types.ts`**: Contains all relevant TypeScript interfaces and enums for the feature (`RestructureMethod`, `RestructureConfig`, etc.).

## 3. Wizard Logic and Flow

The wizard guides the user through a three-step process, enforced by tab navigation that is enabled/disabled based on step completion.

### Step 1: Select Restructure Method

The user chooses one of three restructuring methods:

1.  **Variables to Cases**: Converts data from a "wide" format to a "long" format. Multiple columns (e.g., `Test1`, `Test2`) are stacked into fewer columns (e.g., a single `Test_Score` column and an `Index` column).
2.  **Cases to Variables**: The inverse operation, converting data from "long" to "wide". Rows of measurements are pivoted into distinct columns.
3.  **Transpose All Data**: Performs a simple, complete transposition of the dataset, swapping all rows and columns.

### Step 2: Configure Variables

Based on the chosen method, the user configures the variables for the operation using a drag-and-drop interface:

-   **Variables to Cases**:
    -   **Variables to Restructure**: The set of variables (columns) to be converted into rows.
    -   **Index Variables**: Variables that identify the groups of new cases (e.g., a subject ID).
-   **Cases to Variables**:
    -   **Identifier Variables**: The variable whose unique values will form the new column names (e.g., a 'Time' variable).
    -   **Variables to Restructure**: The variable whose values will be restructured into the new columns.
-   **Transpose All Data**: No variable selection is needed.

The hook (`useRestructure.ts`) includes validation to ensure that the appropriate variables are selected for the chosen method before allowing the user to proceed.

### Step 3: Set Options and Finish

The user configures final, method-specific options:

-   **Variables to Cases**:
    -   `Create count variable`: Adds a column counting non-missing values from the original restructured variables.
    -   `Create index variable`: Adds a column identifying the original variable name for each new case.
-   **Cases to Variables**:
    -   `Drop empty variables`: Removes new columns that contain only missing values after restructuring.

Upon clicking "Finish", the `useRestructure` hook assembles a `RestructureConfig` object and passes it, along with the data and variables, to the `restructureData` function in `restructureService.ts`. The service returns the transformed data, which is then used to update the global `useDataStore` and `useVariableStore`.

## 4. Data Handling and Backend Integration

A critical aspect of this component's logic is that it is a **frontend configuration client**. The `handleFinish` function in the `useRestructure` hook performs a final validation and then assembles all the user's choices into a `RestructureConfig` object.

The code includes a `TODO` comment indicating that this `config` object is intended to be sent to a backend API endpoint for the actual data processing. The current implementation concludes by showing a success alert for demonstration purposes.

This document explains the functionality of the Restructure Data feature, which allows users to restructure datasets in different ways to support various types of analyses.

## 5. Overview

The Restructure Data feature allows users to transform the structure of their dataset to facilitate different analytical approaches. It supports converting variables to cases, cases to variables, and transposing all data. This wizard-based interface guides users through selecting a restructuring method, configuring variables, and setting options.

## 6. Options Explained

### Restructure Methods

#### Variables to Cases

This method transforms multiple variables into cases (rows). Each variable becomes a row with an index variable identifying the original variable.

**Example**: Converting Test1, Test2, Test3 columns into a single Test column with values, and a TestType column indicating which test each value came from.

#### Cases to Variables

This method transforms multiple cases (rows) into variables (columns). Each unique value in the identifier becomes a separate variable.

**Example**: Converting rows of Time1, Time2, Time3 into separate columns Time1_Score, Time2_Score, Time3_Score.

#### Transpose All Data

This method swaps rows and columns for the entire dataset. Rows become columns and columns become rows.

**Example**: A 10×5 dataset becomes a 5×10 dataset with all data rotated.

### Variables Configuration

#### Variables to Restructure

These are the variables that will be transformed according to the selected method:
- In Variables to Cases: These variables will be converted into rows
- In Cases to Variables: These variables will be converted into columns
- In Transpose All Data: All variables will be transposed

#### Index Variables (Variables to Cases method)

These variables identify groups (e.g., Time, ID). They remain as columns in the restructured dataset and help identify which original variable each case came from.

#### Identifier Variables (Cases to Variables method)

These variables identify cases (e.g., Subject ID). They are used to determine how cases are grouped when converting to variables.

### Additional Options

#### Create count variable (Variables to Cases)

When enabled, creates a variable that counts the number of non-missing values for each case.

#### Create index variable (Variables to Cases)

When enabled, creates a variable that identifies which original variable each case came from.

#### Drop empty variables (Cases to Variables)

When enabled, removes variables that contain only missing values after restructuring.

## 7. Algorithm Details

The restructuring algorithms work as follows:

1. **Variables to Cases**:
   - The selected variables are "stacked" to create new rows
   - Each original variable becomes multiple rows in the new dataset
   - The index variable identifies which original variable the value came from
   - Other variables (not selected for restructuring) are replicated for each new row

2. **Cases to Variables**:
   - The selected identifier variables are used to group cases
   - For each unique combination of identifier values, a new set of variables is created
   - Values from the selected variables become data in these new variable columns
   - Cases with the same identifier values are combined into a single case

3. **Transpose All Data**:
   - Variable names become the first column in the new dataset
   - Each row becomes a variable (column) in the new dataset
   - The first row becomes the variable names for the transposed dataset
   - All data points are rotated accordingly

## 8. Usage Examples

### Long to Wide Format (Cases to Variables)

To convert data from long format (multiple observations per subject) to wide format (one row per subject):
1. Select "Cases to Variables" as the restructuring method
2. Select subject/participant ID variables as "Identifier Variables"
3. Select measurement variables as "Variables to Restructure"
4. Click Finish to process

### Wide to Long Format (Variables to Cases)

To convert data from wide format (one row per subject with multiple measurements) to long format (multiple rows per subject):
1. Select "Variables to Cases" as the restructuring method
2. Select measurement variables (e.g., Time1, Time2, Time3) as "Variables to Restructure"
3. Select subject/participant ID variables as "Index Variables"
4. Enable "Create index variable" to track which original variable each value came from
5. Click Finish to process

### Matrix Transposition

To completely transpose your dataset (rows become columns, columns become rows):
1. Select "Transpose All Data" as the restructuring method
2. No variable selection is needed
3. Click Finish to process

## 9. Notes

- The restructuring process creates a new dataset; it does not modify your original data.
- Variable types (numeric, string, etc.) are preserved during restructuring when possible.
- When creating new variables, appropriate variable types are assigned based on the source data.
- For large datasets, the restructuring process may take some time to complete.

## 10. Implementation Details

The Restructure Data feature is implemented as a wizard-based interface with three steps:

1. **Method Selection**:
   - The UI displays three restructuring methods with descriptions
   - Users select the method that best fits their needs

2. **Variable Configuration**:
   - Based on the selected method, different variable selection panels are shown
   - Users drag variables from the available list to appropriate target lists
   - For Variables to Cases: Variables to Restructure and Index Variables
   - For Cases to Variables: Variables to Restructure and Identifier Variables
   - For Transpose All Data: No variable selection is needed

3. **Options Configuration**:
   - Method-specific options are displayed
   - For Variables to Cases: Create count and index variable options
   - For Cases to Variables: Drop empty variables option
   - For Transpose All Data: No additional options are available

Each step includes validation to ensure the user has provided all necessary inputs before proceeding. The wizard provides back/next navigation to move between steps, and includes a summary of selected options before finalizing.

## 11. Sample Test Data

To test the Restructure Data feature, different sample datasets would be needed based on the restructuring method:

### For Variables to Cases testing:

```
SubjectID,Age,Gender,Score1,Score2,Score3
1,25,M,85,90,78
2,30,F,92,88,95
3,28,M,75,82,80
```

After restructuring (Variables to Cases, with Score1-3 as variables to restructure and SubjectID,Age,Gender as index variables):

```
SubjectID,Age,Gender,ScoreType,Score
1,25,M,Score1,85
1,25,M,Score2,90
1,25,M,Score3,78
2,30,F,Score1,92
2,30,F,Score2,88
2,30,F,Score3,95
3,28,M,Score1,75
3,28,M,Score2,82
3,28,M,Score3,80
```

### For Cases to Variables testing:

```
SubjectID,TimePoint,Score
1,1,85
1,2,90
1,3,78
2,1,92
2,2,88
2,3,95
3,1,75
3,2,82
3,3,80
```

After restructuring (Cases to Variables, with SubjectID as identifier variable and Score as variable to restructure):

```
SubjectID,Score_TimePoint_1,Score_TimePoint_2,Score_TimePoint_3
1,85,90,78
2,92,88,95
3,75,82,80
```

These sample datasets can be used to verify the correct operation of each restructuring method and ensure the options work as expected. 