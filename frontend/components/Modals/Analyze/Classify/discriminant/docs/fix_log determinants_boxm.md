# Bug Fix: Log Determinants & Box's M — SPSS Compatibility

## Problem

The Log Determinants and Box's M results in Statify differ from SPSS output.
After the first fix attempt (EPSILON removal), results were still different.
A second round of investigation identified **deeper root causes**.

---

## Root Causes Found

### 1. `compute_c1_factor` — Missing `1.0 -` Prefix (CRITICAL BUG)

**File:** `stats/box_m_test.rs`, function `compute_c1_factor`

The standard Box's M correction factor formula is:

```
ρ = 1 - (2p² + 3p - 1) / (6(p+1)(g-1)) × [Σ1/(nᵢ-1) - 1/(n-g)]
```

The docstring stated this correctly, but the **return statement was missing `1.0 -`**:

```rust
// WRONG (before fix):
if denominator > EPSILON {
    numerator / denominator  // ← Only the fraction, NOT "1 - fraction"
}
```

```rust
// CORRECT (after fix):
if denominator > EPSILON {
    1.0 - (numerator / denominator)  // ρ = 1 - fraction
}
```

**Impact:** Without `1.0 -`, the rho (ρ) correction factor was completely wrong. This cascades into wrong `df2` (second degrees of freedom) and wrong F-approximation p-value.

---

### 2. Inconsistent SVD Threshold Between Functions

**File:** `stats/common.rs`

Two functions compute log determinant with **different** SVD filtering:

| Function | Used By | SVD Threshold |
|---|---|---|
| `calculate_log_determinant` | Box's M (internal pooled log det) | Fixed `EPSILON` (`1e-10`) |
| `calculate_rank_and_log_det` | Log Determinants table (group + pooled) | Scaled `EPSILON * max_val` |

**Before fix:**
```rust
// calculate_log_determinant — WRONG: used fixed EPSILON
.filter(|&v| *v > EPSILON)
```

```rust
// calculate_rank_and_log_det — used scaled threshold
let threshold = EPSILON * max_val;
.filter(|&v| *v > threshold)
```

**After fix:** Both functions now use the **scaled threshold** `EPSILON * max_val`:

```rust
// calculate_log_determinant — CORRECT (after fix):
let max_val = singular_values.iter().fold(0.0, |max, &v| max.max(v));
let threshold = EPSILON * max_val;
singular_values
    .iter()
    .filter(|&v| *v > threshold)
    .map(|v| v.ln())
    .sum()
```

**Impact:** The Pooled Log Determinant in the Log Determinants table differed from the internal Pooled Log Determinant used in Box's M computation.

---

### 3. Three Separate Pooled Matrix Implementations

Three different pooled covariance implementations existed:

| # | Function | Location | Used By |
|---|---|---|---|
| 1 | `calculate_pooled_within_matrix` | `matrix_calculation.rs` | Pooled Matrices table output (keeps EPSILON) |
| 2 | `calculate_pooled_within_matrix_no_epsilon` | `matrix_calculation.rs` | `log_determinant.rs` only |
| 3 | `compute_pooled_covariance_matrix` | `box_m_test.rs` | Box's M internally |

**Fix:** `box_m_test.rs` now calls `calculate_pooled_within_matrix_no_epsilon` (function #2) instead of its own `compute_pooled_covariance_matrix` (function #3). Now **one single function** is used everywhere.

---

### 4. Two Separate Group Covariance Matrix Implementations

`log_determinant.rs` built the group covariance matrix manually with inline loops.
`box_m_test.rs` had its own `compute_group_covariance_matrix` function.

Minor floating-point differences from different execution paths caused accumulated discrepancies.

**Fix:** Created a **single shared function** `compute_group_covariance_matrix_no_epsilon` in `matrix_calculation.rs`, called by both `log_determinant.rs` and `box_m_test.rs`.

---

## Fixes Applied

### Fix 1: `compute_c1_factor` — Restored `1.0 -`

**File:** `stats/box_m_test.rs`

```rust
// Before (WRONG):
numerator / denominator

// After (CORRECT):
1.0 - (numerator / denominator)
```

---

### Fix 2: Unified SVD Threshold

**File:** `stats/common.rs` — `calculate_log_determinant` now uses `EPSILON * max_val` threshold (same as `calculate_rank_and_log_det`).

---

### Fix 3: Shared Group Covariance Function

**File:** `stats/matrix_calculation.rs` — Added `compute_group_covariance_matrix_no_epsilon`:

```rust
pub fn compute_group_covariance_matrix_no_epsilon(
    dataset: &AnalyzedDataset,
    group: &str,
    variables: &[String],
) -> Result<DMatrix<f64>, String>
```

This is the **single source of truth** for group covariance matrices used in both Log Determinants and Box's M.

---

### Fix 4: Shared Pooled Covariance Function

**File:** `stats/box_m_test.rs` — Removed `compute_pooled_covariance_matrix`, now calls `calculate_pooled_within_matrix_no_epsilon` (already used by `log_determinant.rs`).

---

### Fix 5: Complete Rewrite of `log_determinant.rs`

**File:** `stats/log_determinant.rs` — Replaced inline group covariance loop with calls to shared functions:

```rust
use super::core::calculate_log_determinant;
use super::matrix_calculation::compute_group_covariance_matrix_no_epsilon;

// Group covariance: shared function (same as Box's M)
let cov_matrix = compute_group_covariance_matrix_no_epsilon(&dataset, group, variables)?;

// Pooled covariance: shared function (same as Box's M)
let pooled_cov = calculate_pooled_within_matrix_no_epsilon(&dataset, variables);
```

---

## Architecture After Fix

All components now use the same shared functions:

```
                        ┌─────────────────────────────────────┐
                        │  compute_group_covariance_matrix    │
                        │  _no_epsilon (matrix_calculation)  │
                        └──────────┬──────────────────┬───────┘
                                   │                  │
                    ┌──────────────▼─────┐    ┌───────▼──────────────┐
                    │  log_determinant  │    │    box_m_test        │
                    │  (group matrices) │    │ (group matrices)     │
                    └───────────────────┘    └──────────────────────┘
                                   │                  │
                    ┌──────────────▼─────┐    ┌───────▼──────────────┐
                    │  calculate_rank_   │    │  calculate_log_      │
                    │  and_log_det       │    │  determinant         │
                    │  (group log dets)  │    │  (same SVD thresh)   │
                    └───────────────────┘    └──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────────────┐
                    │  calculate_pooled_within_matrix_no_epsilon      │
                    │  (matrix_calculation.rs)                         │
                    └──────────┬───────────────────────────┬────────────┘
                               │                           │
                    ┌──────────▼──────────┐    ┌─────────▼──────────┐
                    │  log_determinant    │    │    box_m_test       │
                    │  (pooled log det)   │    │ (pooled log det)    │
                    └─────────────────────┘    └──────────────────────┘
```

---

## Files Modified

| File | Changes |
|---|---|
| `stats/box_m_test.rs` | Fixed `compute_c1_factor` +1.0-; removed local `compute_group_covariance_matrix` & `compute_pooled_covariance_matrix`; now calls shared functions |
| `stats/log_determinant.rs` | Complete rewrite — uses shared `compute_group_covariance_matrix_no_epsilon` and `calculate_pooled_within_matrix_no_epsilon` |
| `stats/matrix_calculation.rs` | Added `compute_group_covariance_matrix_no_epsilon` function |
| `stats/common.rs` | Unified SVD threshold in `calculate_log_determinant` to use `EPSILON * max_val` |

---

## Covariance Formula

All group covariance matrices use **sample covariance** (divisor = n-1):

```rust
// calculate_covariance in common.rs
.sum::<f64>() / ((values1.len() - 1) as f64)
```

This matches SPSS's default for Log Determinants in discriminant analysis.

---

## Verification Checklist

After rebuilding (`wasm-pack build`), verify:

- [ ] Log Determinants table values match SPSS
- [ ] Box's M statistic matches SPSS
- [ ] Pooled log determinant in the Log Determinants table **exactly equals** the internal pooled log determinant used in Box's M computation (add `console.log` for debugging)
- [ ] Group covariance matrices match between Log Determinants table and Box's M internal computation
- [ ] ρ (rho) correction factor is between 0 and 1
- [ ] df2 (second degrees of freedom) is positive