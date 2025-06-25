# Identify Unusual Cases Feature

This document explains the functionality of the Identify Unusual Cases feature, which detects anomalous observations in a dataset.

## Overview

The Identify Unusual Cases feature helps identify records that differ significantly from other cases in your dataset. Using peer group analysis, this feature identifies unusual cases by comparing each case to similar cases and calculating how much it deviates from expected patterns. This is useful for detecting data entry errors, outliers, and genuinely anomalous cases that may require special attention in your analysis.

## Options Explained

### Variables Configuration

#### Analysis Variables

These are the variables used to evaluate the unusualness of cases. The feature will analyze patterns across these variables and identify cases with unusual combinations of values.

#### Case Identifier Variable

An optional variable used to uniquely identify cases in the output. If specified, this variable's values will be used to identify unusual cases in the output rather than using row numbers.

### Output Options

#### List of Unusual Cases

When enabled, displays a detailed list of unusual cases and the specific reasons each case is considered unusual.

#### Peer Group Norms

Shows the distribution of variable values within each identified peer group. Peer groups are clusters of similar cases used as a baseline for detecting anomalies.

#### Anomaly Indices

Displays the distribution of anomaly index values, which quantify how unusual each case is compared to its peer group.

#### Reason Occurrence by Analysis Variable

Reports how frequently each analysis variable contributes to cases being identified as unusual.

#### Case Processed

Provides a summary of cases included in and excluded from the analysis.

### Save Options

#### Anomaly Index

Saves the calculated anomaly index as a new variable in your dataset.

#### Peer Groups

Saves information about peer group assignment as new variables in your dataset, including peer group ID, size, and percentage.

#### Reasons

Saves detailed information about why cases were flagged as unusual, including the contributing variables, their values, and how they differ from peer norms.

#### Replace Existing Variables

When enabled, replaces existing variables with the same names rather than creating new ones with modified names.

### Missing Values Options

#### Exclude Missing Values

Cases with missing values on any analysis variable are excluded from the analysis.

#### Include Missing Values

Missing values are replaced with the variable's mean for scale variables, or treated as a separate category for categorical variables.

#### Use Proportion of Missing Values as Analysis Variable

When enabled, the proportion of missing values in each case is used as an additional variable for identifying unusual cases.

### Identification Criteria Options

#### Percentage of Cases

Identifies a specified percentage of cases with the highest anomaly index values.

#### Fixed Number of Cases

Identifies a specified number of cases with the highest anomaly index values.

#### Minimum Anomaly Index Value

When enabled, only cases with an anomaly index at or above the specified cutoff value are identified as unusual.

#### Peer Groups

Controls the minimum and maximum number of peer groups to form during the analysis.

#### Maximum Number of Reasons

Specifies the maximum number of reasons to report for why a case is identified as unusual.

## Algorithm Details

The unusual cases detection algorithm works as follows:

1. **Preprocessing**:
   - Cases with missing values are handled according to the specified option (excluded or values imputed)
   - Variables are normalized to ensure equal contribution to the analysis

2. **Peer Group Formation**:
   - Similar cases are grouped together using cluster analysis
   - The number of peer groups is determined based on the specified min/max and data characteristics
   - Each case is assigned to the peer group whose center is closest to it

3. **Anomaly Detection**:
   - For each case, an anomaly index is calculated measuring its deviation from its peer group
   - The anomaly index is based on normalized squared deviations from peer group means
   - Cases with high anomaly index values are identified as unusual

4. **Reason Identification**:
   - For each unusual case, the variables contributing most to its unusualness are identified
   - The impact of each variable is quantified based on its normalized deviation from the peer group norm
   - Variables are ranked by their impact to determine the primary reasons for a case's unusualness

## Usage Examples

### Finding Data Entry Errors

To identify potential data entry errors in a survey dataset:
1. Select key measurement variables (e.g., age, income, education) as analysis variables
2. Choose a unique ID variable as the case identifier
3. Set identification criteria to "Percentage of cases" with 5%
4. Enable "Minimum anomaly index value" with a cutoff of 2.0
5. Save the anomaly index and peer group information
6. Run the analysis to identify cases with highly improbable combinations of values

### Detecting Scientific Outliers

To find unusual specimens in a scientific dataset:
1. Select all measurement variables as analysis variables
2. Set identification criteria to "Fixed number of cases" with a value appropriate for your dataset size
3. Enable all output options to get a comprehensive view of the unusual cases
4. Set maximum reasons to 3 to see the top three reasons each case is flagged
5. Run the analysis to identify the most anomalous specimens

### Quality Control in Manufacturing

To detect abnormal products in a manufacturing quality control dataset:
1. Select product measurement variables as analysis variables
2. Choose the product ID as the case identifier variable
3. Set identification criteria to "Minimum anomaly index value" with a cutoff of 2.5
4. Save reasons for unusualness to identify recurring quality issues
5. Run the analysis to identify potentially defective products

## Notes

- The analysis is more effective when variables are appropriately scaled and normally distributed
- Including too many variables may dilute the analysis, while too few may miss important patterns
- The optimal number of peer groups depends on your data structure and sample size
- Cases with very unusual values in a single variable are often detected even if other variables are normal
- Higher anomaly index values indicate more unusual cases

## Implementation Details

The Identify Unusual Cases feature is implemented with a focus on accuracy and performance:

1. **User Interface**:
   - The UI is divided into tabs for Variables, Output, Save, Missing Values, and Options
   - Variable selection follows a drag-and-drop paradigm for intuitive operation
   - Configuration options are organized logically based on their function

2. **Data Processing Flow**:
   - When the user clicks "OK", the feature performs pre-processing based on configuration
   - A clustering algorithm groups similar cases into peer groups
   - Anomaly indices are calculated for all cases
   - Cases are flagged as unusual based on the specified criteria
   - Results are displayed in the output viewer and/or saved to the dataset

3. **Statistical Methods**:
   - Peer grouping uses an adaptive clustering algorithm to find natural groups in the data
   - Anomaly indices are calculated using normalized Euclidean distances from peer group means
   - Standard deviations within peer groups are used to normalize distances between values and group means

4. **Performance Optimization**:
   - Computations are performed in a separate worker thread to maintain UI responsiveness
   - Efficient algorithms ensure reasonable performance even with large datasets
   - Memory usage is optimized for handling high-dimensional data

## Sample Test Data

To test the Identify Unusual Cases feature, you can use the following sample dataset:

```
ID,Age,Income,Education,Expenses,Savings
1,35,65000,16,45000,15000
2,42,72000,18,48000,20000
3,28,58000,16,40000,12000
4,39,68000,14,47000,18000
5,45,75000,16,52000,22000
6,31,62000,12,43000,15000
7,36,67000,16,46000,18000
8,29,59000,14,42000,13000
9,33,64000,16,44000,16000
10,27,30000,12,45000,5000
```

### Test Scenarios

1. **Basic Anomaly Detection**:
   - Analysis Variables: Age, Income, Education, Expenses, Savings
   - Expected Result: Case #10 should be flagged as unusual due to its anomalous combination of low income, high expenses, and low savings

2. **Financial Patterns Analysis**:
   - Analysis Variables: Income, Expenses, Savings
   - Expected Result: Cases with unusual ratios of income to expenses or savings should be highlighted

3. **Specific Peer Group Analysis**:
   - Analysis Variables: Age, Education, Income
   - Set fixed number of peer groups: 2
   - Expected Result: Cases should be divided into roughly two education/age/income groups, with unusual cases in each group identified

These examples demonstrate how to use the Identify Unusual Cases feature for different analytical needs and validate the expected outcomes. 