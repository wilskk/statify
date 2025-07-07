# Data Modals – Unit Test Index

This README acts as a single gateway to every **unit test** that lives inside `components/Modals/Data/*`.  If you are looking for logic-only coverage (services, hooks, pure utilities) or need to add new unit tests, start here.

---

## 🗂️ Directory Map

```
components/Modals/Data/
├─ Aggregate/
│  └─ __tests__/
├─ DefineDateTime/
│  └─ __tests__/
├─ DefineVarProps/
│  └─ __tests__/
├─ DuplicateCases/
│  └─ __tests__/
├─ Restructure/
│  └─ __tests__/
├─ SelectCases/
│  └─ __tests__/
├─ SetMeasurementLevel/
│  └─ __tests__/
├─ SortCases/
│  └─ __tests__/
├─ SortVars/
│  └─ __tests__/
├─ Transpose/
│  └─ __tests__/
├─ UnusualCases/
│  └─ __tests__/
└─ WeightCases/
   └─ __tests__/
```

Each `__tests__` folder follows the same convention: **unit tests** verify pure business logic (services, hooks, helpers). UI-centric or integration tests are documented inside the modal-specific README files and are deliberately omitted from this index.

---

## 🔢 Aggregate
Location: `Aggregate/__tests__/`

| File | Focus |
|------|-------|
| `Utils.test.ts` | Utility functions for aggregation operators & grouping logic. |
| `useAggregateData.test.ts` | Hook that manages state, validation, and side-effects. |

_Note_: `Aggregate.test.tsx` is a UI test and therefore excluded from this index._

---

## 🗓️ DefineDateTime
Location: `DefineDateTime/__tests__/`

| File | Focus |
|------|-------|
| `dateTimeService.test.ts` | Service responsible for generating new date/time variables. |
| `dateTimeFormatters.test.ts` | Formatter helpers for date/time patterns. |
| `useDefineDateTime.test.ts` | Hook controlling state & validation. |

_Note_: `DefineDateTime.test.tsx` is a UI test and therefore excluded from this index._

---

## 🏷️ DefineVarProps
Location: `DefineVarProps/__tests__/`

| File | Focus |
|------|-------|
| `variablePropertiesService.test.ts` | Service that persists variable property changes. |
| `useVariablesToScan.test.ts` | Hook for scanning & selecting variables. |
| `usePropertiesEditor.test.ts` | Hook that powers the properties wizard editor. |

---

## 📑 DuplicateCases
Location: `DuplicateCases/__tests__/`

| File | Focus |
|------|-------|
| `duplicateCasesService.test.ts` | Service for detecting & handling duplicates. |
| `useDuplicateCases.test.ts` | Hook that orchestrates duplicate case workflows. |

---

## 🔄 Restructure
Location: `Restructure/__tests__/`

| File | Focus |
|------|-------|
| `restructureService.test.ts` | Core algorithms for restructuring data. |
| `useRestructure.test.ts` | Hook state & validation for restructuring wizard. |

---

## 🎯 SelectCases
Location: `SelectCases/__tests__/`

| File | Focus |
|------|-------|
| `evaluator.test.ts` | Expression evaluator for case selection criteria. |
| `selectors.test.ts` | Helper functions for sample & range selectors. |
| `useSelectCases.test.ts` | Hook that manages selection mode & validation. |

---

## 🧮 SetMeasurementLevel
Location: `SetMeasurementLevel/__tests__/`

| File | Focus |
|------|-------|
| `useSetMeasurementLevel.test.tsx` | Hook logic for editing measurement levels. |

_Note_: While this file ends with `.tsx`, it exercises pure hook logic and is treated as a unit test._

---

## ↕️ SortCases
Location: `SortCases/__tests__/`

| File | Focus |
|------|-------|
| `useSortCases.test.ts` | Sorting algorithm & hook state management. |

---

## 🔠 SortVars
Location: `SortVars/__tests__/`

| File | Focus |
|------|-------|
| `sortVarsService.test.ts` | Service that reorders variables based on given criteria. |
| `useSortVariables.test.ts` | Hook handling variable sorting workflow. |

---

## 🔀 Transpose
Location: `Transpose/__tests__/`

| File | Focus |
|------|-------|
| `transposeService.test.ts` | Core logic for transposing rows ↔ columns. |
| `useTranspose.test.ts` | Hook controlling transpose configuration & validation. |

---

## ⚠️ UnusualCases
Location: `UnusualCases/__tests__/`

| File | Focus |
|------|-------|
| `useUnusualCases.test.ts` | Hook for detecting statistical outliers & unusual cases. |

---

## ⚖️ WeightCases
Location: `WeightCases/__tests__/`

_There are currently no dedicated unit tests for this modal. Only UI tests exist (`index.test.tsx`, `WeightCasesUI.test.tsx`). Consider adding unit tests for weighting calculations & validation logic._

---

### Adding New Unit Tests
1. Place the file under the appropriate modal's `__tests__` directory with a `.test.ts` extension (or `.test.tsx` for logic-heavy hooks).
2. Update the modal-specific README **and** this central index so future contributors can find it quickly.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_ 