import { formatOrdinalResult } from "../formatter";

describe("formatOrdinalResult", () => {
  it("should return empty sections if result is null or empty", () => {
    const res = formatOrdinalResult(null);
    expect(res.sections).toEqual([]);
  });

  it("should format all required tables correctly when present", () => {
    const mockResult = {
      summaryStatistics: {
        model: {
          minus2LogLikelihood: 123.4567,
          logLikelihood: -61.72835,
          converged: true,
          iterations: 5,
          method: "fisher_scoring"
        },
        interceptOnly: {
          minus2LogLikelihood: 200.1234,
          logLikelihood: -100.0617
        },
        modelChiSquare: {
          chiSquare: 76.6667,
          df: 3,
          sig: 0.0001
        },
        pseudoRSquare: {
          coxSnell: 0.4567,
          nagelkerke: 0.5678,
          mcfadden: 0.3456
        }
      },
      goodnessOfFit: {
        pearson: {
          chiSquare: 12.3456,
          df: 15,
          sig: 0.6521
        },
        deviance: {
          chiSquare: 11.2345,
          df: 15,
          sig: 0.7412
        }
      },
      parameterEstimates: [
        {
          group: "Threshold",
          variable: "[y = 1]",
          estimate: -1.2345,
          stdError: 0.3456,
          wald: 12.7654,
          sig: 0.0003,
          lower: -1.9118,
          upper: -0.5572
        },
        {
          group: "Location",
          variable: "x1",
          estimate: 0.8765,
          stdError: 0.2345,
          wald: 13.9682,
          sig: 0.0001,
          lower: 0.4168,
          upper: 1.3361
        }
      ],
      testOfParallelLines: {
        minus2LogLikelihoodParallel: 123.4567,
        minus2LogLikelihoodNonParallel: 120.1234,
        chiSquare: 3.3333,
        df: 2,
        sig: 0.1888,
        converged: true
      },
      iterationHistory: [
        {
          iteration: 1,
          logLikelihood: -80.1234,
          minus2LogLikelihood: 160.2468,
          step: 1.0,
          maxAbsGradient: 10.5,
          maxAbsDelta: 2.1,
          thresholdAdjustments: 0
        },
        {
          iteration: 2,
          logLikelihood: -61.7284,
          minus2LogLikelihood: 123.4568,
          step: 1.0,
          maxAbsGradient: 0.01,
          maxAbsDelta: 0.001,
          thresholdAdjustments: 0
        }
      ]
    };

    const formatted = formatOrdinalResult(mockResult);
    expect(formatted.sections).toHaveLength(6);

    // Verify Model Fitting Info
    const modelFitting = formatted.sections.find(s => s.id === "ordinal_model_fitting_information");
    expect(modelFitting).toBeDefined();
    expect(modelFitting?.data.rows[0].neg2ll).toBe("200.123");
    expect(modelFitting?.data.rows[1].neg2ll).toBe("123.457");
    expect(modelFitting?.data.rows[1].chiSquare).toBe("76.667");
    expect(modelFitting?.data.rows[1].df).toBe("3");
    expect(modelFitting?.data.rows[1].sig).toBe("< .001"); // 0.0001 is < 0.001, so formatted as "< .001"

    // Verify Goodness-of-Fit
    const gof = formatted.sections.find(s => s.id === "ordinal_goodness_of_fit");
    expect(gof).toBeDefined();
    expect(gof?.data.rows[0].chiSquare).toBe("12.346");
    expect(gof?.data.rows[0].df).toBe("15");
    expect(gof?.data.rows[0].sig).toBe("0.652");

    // Verify Pseudo R-Square
    const pseudo = formatted.sections.find(s => s.id === "ordinal_pseudo_r_square");
    expect(pseudo).toBeDefined();
    expect(pseudo?.data.rows[0].value).toBe("0.457");
    expect(pseudo?.data.rows[1].value).toBe("0.568");
    expect(pseudo?.data.rows[2].value).toBe("0.346");

    // Verify Parameter Estimates
    const params = formatted.sections.find(s => s.id === "ordinal_parameter_estimates");
    expect(params).toBeDefined();
    expect(params?.data.rows[0].estimate).toBe("-1.235");
    expect(params?.data.rows[1].estimate).toBe("0.877");

    // Verify Test of Parallel Lines
    const parallel = formatted.sections.find(s => s.id === "ordinal_test_of_parallel_lines");
    expect(parallel).toBeDefined();
    expect(parallel?.data.rows[0].neg2ll).toBe("123.457");
    expect(parallel?.data.rows[1].neg2ll).toBe("120.123");
    expect(parallel?.data.rows[1].chiSquare).toBe("3.333");
    expect(parallel?.data.rows[1].df).toBe("2");
    expect(parallel?.data.rows[1].sig).toBe("0.189");

    // Verify Iteration History
    const iterHistory = formatted.sections.find(s => s.id === "ordinal_iteration_history");
    expect(iterHistory).toBeDefined();
    expect(iterHistory?.data.rows[0].neg2ll).toBe("160.247");
    expect(iterHistory?.data.rows[1].neg2ll).toBe("123.457");
    expect(iterHistory?.data.rows[1].maxAbsGradient).toBe("0.010");
  });
});
