# Duplicate Cases Feature

This document explains the functionality of the Duplicate Cases feature, which identifies and marks duplicate cases in a dataset based on matching variables.

## Overview

The Duplicate Cases feature allows users to identify duplicate cases in a dataset based on specified matching variables. It creates indicator variables to mark primary and duplicate cases, and provides options for sorting and managing the results.

## Options Explained

### Variables to Create

#### Indicator of primary cases (1=unique or primary, 0=duplicate)

This option creates a variable in your dataset that marks each case as either:
- **1**: Primary case (the first or last occurrence of a matching group, depending on your selection)
- **0**: Duplicate case (all other occurrences of a matching group)

This indicator can be used for filtering, analysis, or further data processing.

#### Name (Primary Case Indicator)

Default: `PrimaryLast`

This specifies the name of the variable that will be created to indicate primary/duplicate cases. This variable will appear as a new column in your dataset.

#### Primary Case Selection

##### Last case in each group is primary

When selected, the last occurrence of each matching group will be marked as the primary case (1), and all others as duplicates (0).

##### First case in each group is primary

When selected, the first occurrence of each matching group will be marked as the primary case (1), and all others as duplicates (0).

#### Filter by indicator values

When checked, this option will apply a filter to your dataset after processing, showing only the cases you've marked as primary (1). This is useful for quickly removing duplicates from view.

#### Sequential count of matching case in each group (0=nonmatching case)

When enabled, this creates an additional variable that numbers each case within a matching group sequentially:
- **0**: Non-matching case (unique)
- **1, 2, 3, ...**: Sequential number within a matching group

This provides more granular information about the duplicate structure in your data.

#### Name (Sequential Count)

Default: `MatchSequence`

This specifies the name of the variable that will be created to indicate the sequential count of matches. This variable will appear as a new column in your dataset.

### Additional Options

#### Move matching cases to the top of the file

When checked, matching cases (cases that have at least one duplicate) will be reordered to appear at the top of the dataset. This makes it easier to examine the duplicates.

#### Display frequencies for created variables

When checked, frequency tables for the newly created variables will be displayed in the output. This provides a summary of how many primary cases and duplicates were identified.

## Algorithm Details

The duplicate cases identification algorithm works as follows:

1. **Matching Process**:
   - Cases are compared based on the values of the selected matching variables.
   - Two cases are considered duplicates if they have identical values for all matching variables.
   - Groups of matching cases are identified throughout the dataset.

2. **Sorting Process** (if sorting variables are specified):
   - Within each group of matching cases, the cases are sorted based on the values of the specified sorting variables.
   - The sort order (ascending or descending) is applied as specified.

3. **Primary Case Designation**:
   - Based on the selected option (first or last), one case in each group is designated as the primary case.
   - All other cases in the group are marked as duplicates.

4. **Sequential Numbering** (if enabled):
   - Cases within each matching group are numbered sequentially (1, 2, 3, ...).
   - Non-matching cases (unique cases) are assigned a value of 0.

5. **Reordering** (if "Move matching cases to top" is selected):
   - Matching cases (cases with at least one duplicate) are moved to the top of the dataset.
   - The original order within matching groups is preserved.

## Usage Examples

### Finding Exact Duplicates

To find exact duplicate records:
1. Move all variables to the "Define matching cases by" list
2. Choose whether the first or last occurrence should be considered primary
3. Click OK to process

### Finding Partial Matches

To find records that match on specific criteria:
1. Move only the relevant variables (e.g., Name, ID, etc.) to the "Define matching cases by" list
2. Optionally add sorting variables to determine the order within matching groups
3. Click OK to process

### Creating a De-duplicated Dataset

To create a dataset with duplicates removed:
1. Configure the matching variables as desired
2. Check "Filter by indicator values"
3. Click OK to process

## Notes

- The primary case indicator variable and sequential count variable are added as new columns to your dataset.
- The process does not delete any data; it only adds indicator variables and optionally reorders the cases.
- Use the indicator variables with filtering functionality to show only primary or duplicate cases as needed.

## Implementation Details

The Duplicate Cases feature is implemented using a web worker to perform the processing in a background thread, preventing UI freezes during computation. The implementation follows these steps:

1. **Data Collection**: The UI collects matching variables, sorting variables, and various configuration options from the user.

2. **Worker Processing**: When the user clicks "OK", the data and configuration are sent to a web worker (`duplicateCases.worker.js`).

3. **Matching Algorithm**: The worker processes the data to identify matching cases and creates the required indicator variables:
   - Groups cases based on matching variables
   - Sorts within groups if sorting variables are specified
   - Designates primary cases (first or last in each group)
   - Creates sequential numbering if requested
   - Reorders data if "move matching cases to top" is selected
   
4. **Result Processing**: After the worker completes, the main thread:
   - Creates new variables in the dataset for the indicators
   - Updates the data with indicator values
   - Reorders the data if requested
   - Displays frequency statistics if requested

The worker implementation is designed to handle large datasets efficiently by using fast lookup structures and minimizing memory usage during processing. 

## Sample Test Data

A sample CSV file (`dummy_duplicate_cases.csv`) is provided for testing the Duplicate Cases feature. This dataset contains intentional duplicates with various patterns:

```
ID,Name,Age,City,Income,Department
1,John Smith,34,New York,75000,Sales
2,Mary Johnson,29,Chicago,65000,Marketing
3,Robert Lee,45,San Francisco,85000,Engineering
4,Lisa Wong,31,New York,72000,Sales
5,John Smith,34,New York,75000,Sales
6,David Brown,42,Boston,80000,Finance
7,Sarah Miller,36,Chicago,70000,Marketing
8,Robert Lee,45,Los Angeles,90000,Engineering
9,James Wilson,38,New York,82000,Sales
10,Mary Johnson,29,Chicago,65000,Marketing
11,Jennifer Garcia,33,Miami,68000,HR
12,Michael Davis,44,San Francisco,92000,Engineering
13,Robert Lee,45,San Francisco,85000,Engineering
14,Emily White,27,Boston,62000,Marketing
15,John Smith,34,New York,75000,Sales
16,Thomas Moore,39,Chicago,78000,Finance
17,Sarah Miller,36,Chicago,70000,Marketing
18,Patricia Clark,41,Miami,76000,HR
19,Lisa Wong,31,New York,72000,Sales
20,James Wilson,38,New York,82000,Sales
```

### Notable Duplicate Patterns

1. **Exact duplicates (identical in all fields):**
   - John Smith (rows 1, 5, 15) - appears 3 times
   - Mary Johnson (rows 2, 10) - appears 2 times
   - Sarah Miller (rows 7, 17) - appears 2 times
   - Lisa Wong (rows 4, 19) - appears 2 times
   - James Wilson (rows 9, 20) - appears 2 times

2. **Partial duplicates (same name but different other attributes):**
   - Robert Lee (rows 3, 8, 13) - same name and age, but different cities and incomes

### Testing Scenarios

1. **Testing exact matches:**
   - Use Name, Age, City, Income, and Department as matching variables

2. **Testing partial matches:**
   - Use only Name as matching variable
   - Use Name and Age as matching variables

3. **Testing sorting options:**
   - Match on Name and sort by Income (ascending/descending)
   - Match on Name and sort by City (ascending/descending)

4. **Testing primary case selection:**
   - Try both "first case is primary" and "last case is primary" options

This sample data allows you to thoroughly test all aspects of the Duplicate Cases functionality and understand how different configuration options affect the results. 