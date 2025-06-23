# Select Cases Feature

This document explains the functionality of the Select Cases feature, which allows users to filter or delete cases (rows) based on various criteria.

## Overview

The Select Cases feature enables users to filter their dataset by selecting specific cases that meet criteria, or to permanently delete unselected cases. This is useful for focusing analysis on a subset of data, creating samples, or removing unwanted observations.

## Options Explained

### Selection Methods

#### All Cases

Selects all cases in the dataset. This effectively removes any previously applied filtering.

#### If Condition is Satisfied

Allows you to create a logical expression to filter cases:
- Only cases that satisfy the specified condition will be selected
- Uses comparison operators like >, <, =, != and logical operators like AND, OR, NOT
- Supports mathematical and statistical functions for complex conditions

#### Random Sample of Cases

Selects a random subset of cases from the dataset:
- **Approximately**: Selects approximately a specified percentage of all cases
- **Exactly**: Selects exactly the specified number of cases from the first N cases

#### Based on Time or Case Range

Selects cases based on their position in the dataset:
- **First Case**: Starting case number (1-based index)
- **Last Case**: Ending case number (1-based index)
- If first case is omitted, selection starts from the beginning
- If last case is omitted, selection continues to the end

#### Use Filter Variable

Uses an existing variable as a filter:
- Non-zero/non-empty values in the selected variable indicate cases to be selected
- Zero/empty values indicate cases to be filtered out

### Output Options

#### Filter Out Unselected Cases

When this option is selected:
- A filter is applied to the dataset to temporarily hide unselected cases
- The filter variable (named "filter_$") is created or updated
- The original dataset remains intact, but only selected cases are displayed
- The filter can be removed later to show all cases again

#### Delete Unselected Cases

When this option is selected:
- Unselected cases are permanently removed from the dataset
- This operation cannot be undone
- The dataset size is reduced

## Algorithm Details

The case selection algorithm works as follows:

1. **Condition Evaluation**:
   - For "If condition" selection, each case is evaluated against the logical expression
   - Cases that satisfy the condition are marked for selection

2. **Random Sampling**:
   - For percentage-based sampling, random numbers are generated and compared against the specified percentage
   - For exact sampling, a random subset of the specified size is selected

3. **Range Selection**:
   - Cases within the specified range (from first case to last case) are selected
   - Case numbering is 1-based (first case is number 1)

4. **Filter Application**:
   - A binary filter variable ("filter_$") is created or updated
   - Selected cases get a value of 1, unselected cases get a value of 0

5. **Output Generation**:
   - If "Filter" is chosen, unselected cases are hidden from view but remain in the dataset
   - If "Delete" is chosen, unselected cases are permanently removed from the dataset

## Usage Examples

### Filtering by Condition

To select cases where age is greater than 30 and income is above 50,000:
1. Select "If condition is satisfied" option
2. Click "If..." button
3. Enter condition: `age > 30 & income >= 50000`
4. Choose "Filter out unselected cases"
5. Click OK to apply the filter

### Creating a Random Sample

To create a 10% random sample of your data:
1. Select "Random sample of cases" option
2. Click "Sample..." button
3. Choose "Approximately" and enter "10" for percentage
4. Select desired output option (filter or delete)
5. Click OK to create the sample

### Selecting a Range of Cases

To select cases 100 through 500:
1. Select "Based on time or case range" option
2. Click "Range..." button
3. Enter "100" for First Case and "500" for Last Case
4. Select desired output option (filter or delete)
5. Click OK to select the range

### Using a Filter Variable

To filter cases based on a variable (e.g., where "Include" = 1):
1. Select "Use filter variable" option
2. Select the "Include" variable from the variable list
3. Choose output option (filter or delete)
4. Click OK to apply the filter

## Notes

- When filtering cases, the "filter_$" variable is automatically created or updated.
- The current filter status is shown at the bottom of the dialog.
- For complex conditions, you can use the If Condition dialog which provides function buttons and variable selection.
- Random sampling uses a pseudo-random number generator with equal probability distribution.
- Deleting unselected cases is permanent and cannot be undone.

## Implementation Details

The Select Cases feature is implemented with several components:

1. **Main Interface**:
   - Selection method options with specialized sub-dialogs
   - Output options for filtering or deletion
   - Status display showing the current filter condition

2. **If Condition Dialog**:
   - Expression builder with mathematical and logical operators
   - Variable selection from the dataset
   - Function selection with categorized functions
   - Syntax validation to ensure valid expressions

3. **Random Sample Dialog**:
   - Options for approximate percentage or exact count
   - Input validation for percentage and count values

4. **Range Dialog**:
   - Options for specifying first and last case
   - Validation to ensure proper range specification

## Sample Test Data

To test the Select Cases feature, you can use the following sample dataset:

```
ID,Gender,Age,Income,Education,Region
1,M,45,72000,16,North
2,F,29,58000,16,South
3,M,36,65000,12,West
4,F,52,48000,12,East
5,M,23,42000,14,North
6,F,41,85000,18,South
7,M,38,67000,16,West
8,F,24,39000,12,East
9,M,59,92000,16,North
10,F,33,62000,14,South
```

### Test Scenarios

1. **Age Filter**:
   - Condition: `Age > 35`
   - Expected Result: Selection of IDs 1, 4, 6, 7, 9

2. **Combined Condition**:
   - Condition: `Gender == "F" & Income > 60000`
   - Expected Result: Selection of IDs 6, 10

3. **Random Sample**:
   - Approximately 30% of cases
   - Expected Result: Random selection of about 3 cases

4. **Range Selection**:
   - Range: 4 to 8
   - Expected Result: Selection of IDs 4, 5, 6, 7, 8

These examples demonstrate how to use the Select Cases feature for different filtering needs and validate the expected outcomes.

## If Condition Syntax

The If Condition dialog supports a rich expression language for filtering cases. Here are the key components:

### Comparison Operators

- `==` Equal to (use with both numbers and text)
- `!=` Not equal to
- `>` Greater than
- `<` Less than
- `>=` Greater than or equal to
- `<=` Less than or equal to

### Logical Operators

- `&` AND - Both conditions must be true
- `|` OR - Either condition must be true
- `~` NOT - Negates a condition

### Supported Functions

#### Math Functions
- `ABS(x)` - Absolute value
- `SQRT(x)` - Square root
- `ROUND(x)` - Round to nearest integer
- `MAX(x, y, ...)` - Maximum value
- `MIN(x, y, ...)` - Minimum value
- `SUM(x, y, ...)` - Sum of values
- `POW(x, y)` - Power
- `EXP(x)` - Exponential (e^x)
- `LOG(x)` - Natural logarithm
- `LOG10(x)` - Base 10 logarithm
- `MOD(x, y)` - Modulo (remainder)

#### Text Functions
- `CONCAT(str1, str2)` - Concatenate strings
- `LENGTH(text)` - Get length of text
- `LOWER(text)` - Convert to lowercase
- `UPPER(text)` - Convert to uppercase
- `TRIM(text)` - Remove spaces from start and end
- `LEFT(text, n)` - Get n characters from left
- `RIGHT(text, n)` - Get n characters from right
- `SUBSTRING(text, start, end)` - Get substring

#### Statistical Functions
- `MEAN(x, y, ...)` - Average of values
- `MEDIAN(x, y, ...)` - Middle value
- `SD(x, y, ...)` - Standard deviation
- `COUNT(x, y, ...)` - Count of values
- `MISSING(var)` - Check if a variable is missing
- `VARIANCE(x, y, ...)` - Statistical variance
- `STDEV(x, y, ...)` - Standard deviation
- `PERCENTILE(values, k)` - kth percentile
- `QUARTILE(values, quart)` - Quartile value

### Example Expressions

```
# Basic comparisons
age > 30
income >= 50000
gender == "F"

# Combining conditions
age > 30 & income >= 50000
gender == "F" | age < 25
~(region == "North")

# Using functions
SQRT(income) > 250
MEAN(score1, score2, score3) >= 75
UPPER(gender) == "F"

# Complex conditions
(age > 40 & income > 60000) | (education >= 16 & region == "West")
~MISSING(income) & (income > MEAN(income1, income2, income3))
``` 