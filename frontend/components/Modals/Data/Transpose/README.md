# Transpose Data Feature

This document explains the functionality of the Transpose Data feature, which allows users to switch rows and columns in their dataset.

## Overview

The Transpose Data feature enables users to flip the orientation of their dataset, transforming rows into columns and columns into rows. This operation is useful for changing data layout, preparing data for specific analyses, or creating a different view of the same information.

## Options Explained

### Variable Selection

#### Variables to Transpose

These are the variables that will be transposed in the operation. You can select any subset of variables from your dataset to include in the transposition.

#### Name Variable

The name variable determines what will be used for the names of the new variables created after transposition:
- If specified, the values from this variable will be used as names for the newly created variables
- If not specified, the system will generate default names (case1, case2, etc.)

### Transposition Options

#### Create Variable Names from First Row of Data

When enabled, the values from the first row of data in the selected variables are used as the names for the new variables, and the first row of data is excluded from the transposed dataset.

#### Keep Original Variable as ID Variable

When enabled, a selected variable is kept as an identifier in the transposed dataset. This variable's values will not be transposed but will instead be used to identify the new rows.

## Algorithm Details

The transpose operation works as follows:

1. **Preparation**:
   - Selected variables are identified for transposition
   - If a name variable is specified, its values are extracted for use as new variable names
   - If "Create Variable Names from First Row" is enabled, values from the first row are captured

2. **Transposition Process**:
   - Each row in the original dataset becomes a column in the new dataset
   - Each column in the original dataset becomes a row in the new dataset
   - If an ID variable is kept, its values are preserved as identifiers for the new rows

3. **Name Assignment**:
   - New variable names are assigned based on the selected naming option
   - Names are validated and modified if needed to ensure they are valid variable names
   - Default names are generated for any missing or invalid names

## Usage Examples

### Simple Transposition

To convert a wide format dataset to long format:
1. Select all variables to transpose
2. Do not specify a name variable
3. Disable "Create Variable Names from First Row"
4. Click OK to process
5. The resulting dataset will have rows and columns switched

### Using Variable Values as Names

To transpose data with meaningful variable names:
1. Select the variables to transpose
2. Select an identifier variable as the "Name Variable"
3. Enable "Keep Original Variable as ID Variable" if needed
4. Click OK to process
5. The resulting dataset will use values from the name variable as the names of the new variables

### Headers from First Row

To use first row values as variable names:
1. Select the variables to transpose
2. Enable "Create Variable Names from First Row of Data"
3. Click OK to process
4. The resulting dataset will use the first row values as variable names, and that row will be excluded from the data

## Notes

- Transposing a dataset can dramatically change its structure and may require additional data preparation before or after the operation.
- Variable types are preserved when possible, but some type conversions may occur if the transposed values are not compatible with the original type.
- Large datasets may take longer to transpose, as the operation requires reorganizing all data.
- If the resulting column names would contain invalid characters, they will be automatically modified to comply with variable naming rules.

## Implementation Details

The Transpose feature is implemented with a focus on flexibility and data integrity:

1. **User Interface**:
   - The UI provides clear selection of variables to transpose
   - Options for naming control help users get the desired output structure
   - Preview capability helps visualize the transformation

2. **Data Processing Flow**:
   - When the user clicks "OK", the selected variables are identified
   - Name sources are determined based on user selections
   - The data matrix is rotated in memory
   - New variables are created with appropriate names and types
   - The transposed data is written to the dataset

3. **Data Type Handling**:
   - Variable types are preserved when possible
   - Mixed types in a column are handled by conversion to the most appropriate common type
   - Missing values are preserved through the transposition process

## Sample Test Data

To test the Transpose feature, you can use the following sample dataset:

```
ID,Year,Q1,Q2,Q3,Q4
1,2020,10,15,20,25
2,2021,12,18,22,28
3,2022,14,21,24,30
```

### Test Scenarios

1. **Basic Transposition**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Expected Result: A dataset with rows for each quarter and columns for each year

2. **Using Year as Names**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Name Variable: Year
   - Expected Result: A dataset with rows for each quarter and columns named by year values

3. **Keeping ID Variable**:
   - Variables to Transpose: Year, Q1, Q2, Q3, Q4
   - Name Variable: ID
   - Keep Original Variable as ID: Checked
   - Expected Result: A dataset with ID as the first column, and transposed data with row names from the ID values

4. **First Row as Variable Names**:
   - Variables to Transpose: All
   - Create Variable Names from First Row: Checked
   - Expected Result: A dataset using the values from the first row as column names

These examples demonstrate how to use the Transpose Data feature for different data restructuring needs and validate the expected outcomes. 