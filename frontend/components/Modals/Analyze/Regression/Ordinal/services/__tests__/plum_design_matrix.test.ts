import { buildOrdinalPlumDesignMatrix } from "../plum_design_matrix";
import { Variable } from "@/types/Variable";

const buildVariable = (name: string, columnIndex: number): Variable => ({
  id: columnIndex,
  columnIndex,
  name,
  width: 8,
  decimals: 0,
  values: [],
  missing: null,
  columns: 1,
  align: "right",
  measure: "scale",
  role: "input",
});

describe("buildOrdinalPlumDesignMatrix", () => {
  it("treats numeric factor as categorical with reference last", () => {
    const rows = [
      { 0: "rendah", 1: 1, 2: 10 },
      { 0: "sedang", 1: 2, 2: 20 },
      { 0: "tinggi", 1: 3, 2: 30 },
    ];

    const factor = buildVariable("X1", 1);
    const covariate = buildVariable("X2", 2);

    const result = buildOrdinalPlumDesignMatrix({
      rows,
      factors: [factor],
      covariates: [covariate],
      interactions: [],
      getRowValue: (row, index) => row?.[index],
      toNumberOrThrow: (value, label) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          throw new Error(`Invalid numeric ${label}`);
        }
        return numeric;
      },
    });

    expect(result.locationTermNames).toEqual(["X2", "X1=1", "X1=2"]);
    expect(result.factorLevelMetadata).toHaveLength(3);

    const reference = result.factorLevelMetadata.find((entry) => entry.isReference);
    expect(reference?.levelValue).toBe("3");
    expect(reference?.activeColumnIndex).toBeNull();
  });
});
