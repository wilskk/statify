import { buildCaseProcessingSummary, recoverMedoidsFromMismatch } from "@/components/Modals/Analyze/Classify/k-medoids-cluster/services/k-medoids-cluster-guards";

describe("k-medoids guard helpers", () => {
    test("recoverMedoidsFromMismatch prefers label-based representatives", () => {
        const labels = [0, 0, 1, 1, 2, 2];
        const rawMedoids = [0, 1, 0, 1, 2, 2];

        const recovered = recoverMedoidsFromMismatch(rawMedoids, labels, 3, labels.length);

        expect(recovered).toHaveLength(3);
        expect(recovered).toEqual([0, 2, 4]);
    });

    test("recoverMedoidsFromMismatch ignores out-of-range raw values and fills safely", () => {
        const labels = [0, 0, 1, 1];
        const rawMedoids = [99, -1, 2, 2];

        const recovered = recoverMedoidsFromMismatch(rawMedoids, labels, 3, labels.length);

        expect(recovered).toHaveLength(3);
        recovered.forEach((idx) => {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(labels.length);
        });
    });

    test("buildCaseProcessingSummary computes missing and percentages from total", () => {
        const summary = buildCaseProcessingSummary(8, 10);

        expect(summary.validN).toBe(8);
        expect(summary.missingN).toBe(2);
        expect(summary.validPercent).toBe("80.0");
        expect(summary.missingPercent).toBe("20.0");
        expect(summary.totalN).toBe(10);
        expect(summary.totalPercent).toBe("100.0");
    });

    test("buildCaseProcessingSummary includes preprocessing and missing-variable details", () => {
        const summary = buildCaseProcessingSummary(6, 10, {
            initialN: 10,
            preprocessedN: 6,
            missingRowsRemoved: 3,
            outlierRowsRemoved: 1,
            missingByVariable: {
                VAR2: 3,
                VAR3: 1,
                VAR4: 0,
            },
        });

        expect(summary.initialN).toBe(10);
        expect(summary.preprocessedN).toBe(6);
        expect(summary.missingRowsRemoved).toBe(3);
        expect(summary.outlierRowsRemoved).toBe(1);
        expect(summary.missingVariablesText).toContain("VAR2 (3)");
        expect(summary.missingVariablesText).toContain("VAR3 (1)");
    });
});
