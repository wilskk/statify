<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

## Documentation: SPSS Duplicate Case Feature Algorithm

**Overview**

The *Identify Duplicate Cases* feature in SPSS is designed to detect and manage duplicate records within a dataset. Duplicate cases are entries that share identical values across specified variables, often resulting from data entry errors or merging datasets. This process helps ensure data integrity before conducting further analysis[^1_2][^1_3][^1_5].

---

**Algorithm Steps**

**1. Open Dataset**

- Start by loading your dataset into the SPSS Data Editor[^1_2][^1_3][^1_4].

**2. Define Duplicates**

- Decide which variable(s) will be used to identify duplicates. This is typically a unique identifier (like ID), but can include multiple variables if duplicates are defined by a combination (e.g., ID and Date)[^1_2][^1_5].

**3. Access the Feature**

- Navigate to the menu:
`Data > Identify Duplicate Cases`[^1_2][^1_3][^1_4][^1_5].

**4. Specify Matching Criteria**

- In the dialog box:
    - Move your chosen variable(s) into the "Define matching cases by" box.
    - If you want to identify duplicates based on more than one variable, select all relevant variables[^1_2][^1_5].

**5. Sorting (Optional)**

- You can specify additional sort variables to determine which case in a duplicate group is considered the "primary" (to be kept) and which are "duplicates" (to be flagged or removed). Sorting can be ascending or descending, depending on your preference (e.g., by date to keep the most recent record)[^1_5].

**6. Output Options**

- SPSS will create a new variable (by default named `PrimaryLast`) that flags each case:
    - `1` indicates the primary (first or last, depending on sort) case in each duplicate group.
    - `0` indicates a duplicate[^1_4][^1_5].

**7. Review and Manage Duplicates**

- Duplicates are now flagged in your data. You can:
    - Inspect flagged cases visually (duplicates are often moved to the top of the file).
    - Use `Data > Select Cases` to filter or delete duplicates based on the flag variable[^1_3][^1_4].

**8. (Optional) Syntax Approach**

- For automation or reproducibility, you can use SPSS syntax. Example:

```spss
SORT CASES BY id (A).
IF (LAG(id) = id) duplicate = 1.
EXECUTE.
```

This marks duplicates in a new variable (`duplicate`)[^1_4].

---

## Summary Table: Key Steps

| Step | Action |
| :-- | :-- |
| Open Dataset | Load data into SPSS Data Editor |
| Define Duplicates | Select variable(s) for identifying duplicates |
| Access Feature | Data > Identify Duplicate Cases |
| Specify Criteria | Move variables to "Define matching cases by" |
| Sorting (Optional) | Choose sort variables for primary/duplicate determination |
| Output | SPSS creates a flag variable (e.g., PrimaryLast) marking primary (1) and duplicate (0) |
| Review/Manage | Inspect, filter, or delete duplicates as needed |
| Syntax Alternative | Use SPSS syntax for batch processing |


---

**Notes**

- Duplicates are defined as cases with identical values in the selected variables.
- The process is flexible: you can define duplicates by any variable(s) relevant to your analysis[^1_5].
- Always review flagged cases before deleting, as some duplicates may be intentional or require further investigation[^1_3][^1_5].

---

**References**

- The above steps are synthesized from multiple guides and official IBM SPSS documentation[^1_2][^1_3][^1_4][^1_5].

<div style="text-align: center">⁂</div>

[^1_1]: https://www.youtube.com/watch?v=iTb6TNB8uOA

[^1_2]: https://www.learningspss.com/2016/07/identify-duplicate-case-in-spss.html

[^1_3]: https://id.scribd.com/document/815997221/statisrik-Duplikat-case

[^1_4]: https://www.ibm.com/support/pages/how-identify-duplicate-cases-ibm-spss-statistics

[^1_5]: https://www.ibm.com/docs/en/spss-statistics/beta?topic=preparation-identify-duplicate-cases

[^1_6]: https://id.scribd.com/document/327150629/pak-adi

[^1_7]: https://repository.unikom.ac.id/32281/1/BAB.II Pengenalan Menu SPSS.doc

[^1_8]: https://www.ibm.com/support/pages/spss-statistics-identify-duplicate-cases-not-picking-specific-value

[^1_9]: https://ian.upr.ac.id/wp-content/uploads/2024/10/Buku-Saku-Digital-Aplikasi-SPSS-Versi-29.pdf

[^1_10]: https://stackoverflow.com/questions/71309170/spss-how-do-i-generate-id-numbers-from-client-id-variable-that-contains-duplica

