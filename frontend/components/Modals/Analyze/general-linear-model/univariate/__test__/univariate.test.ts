/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import init, {
    UnivariateAnalysis,
} from "@/components/Modals/Analyze/general-linear-model/univariate/rust/pkg/wasm";
import path from "path";
import fs from "fs";

// --- Data Sampel untuk Pengujian ---

const invalidFormatData = [
    {
        happiness: null,
    },
];

const allNullData = [[{ happiness: null }, { happiness: null }]];

const emptyData = [[]];

const validDepData = [
    [
        { happiness: 1 },
        { happiness: 2 },
        { happiness: 3 },
        { happiness: 4 },
        { happiness: 5 },
    ],
];
const validFixFactorData = [
    [
        { gender: "Male" },
        { gender: "Female" },
        { gender: "Male" },
        { gender: "Female" },
        { gender: "Male" },
    ],
];
const validRandFactorData = [
    [
        { school: "A" },
        { school: "B" },
        { school: "A" },
        { school: "B" },
        { school: "A" },
    ],
];
const validCovarData = [
    [{ age: 25 }, { age: 30 }, { age: 22 }, { age: 35 }, { age: 28 }],
];
const validWlsData = [
    [
        { weight: 1.1 },
        { weight: 0.9 },
        { weight: 1.0 },
        { weight: 1.2 },
        { weight: 0.8 },
    ],
];

// --- Definisi Variabel untuk Pengujian ---

const invalidDefsFormat = [
    {
        id: 1,
        name: "invalid",
    },
];

const validDepDefs = [
    [
        {
            id: 1,
            columnIndex: 1,
            name: "happiness",
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "Tingkat Kebahagiaan",
            values: [],
            missing: [],
            columns: 100,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];
const validFixFactorDefs = [
    [
        {
            id: 2,
            columnIndex: 2,
            name: "gender",
            type: "STRING",
            width: 8,
            decimals: 0,
            label: "Jenis Kelamin",
            values: [],
            missing: [],
            columns: 100,
            align: "left",
            measure: "nominal",
            role: "input",
        },
    ],
];
const validRandFactorDefs = [
    [
        {
            id: 3,
            columnIndex: 3,
            name: "school",
            type: "STRING",
            width: 8,
            decimals: 0,
            label: "Sekolah Asal",
            values: [],
            missing: [],
            columns: 100,
            align: "left",
            measure: "nominal",
            role: "input",
        },
    ],
];
const validCovarDefs = [
    [
        {
            id: 4,
            columnIndex: 4,
            name: "age",
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: "Umur",
            values: [],
            missing: [],
            columns: 100,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];
const validWlsDefs = [
    [
        {
            id: 5,
            columnIndex: 5,
            name: "weight",
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "WLS Weight",
            values: [],
            missing: [],
            columns: 100,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];

// --- Konfigurasi untuk Pengujian ---

// Definisikan variabel untuk digunakan dalam a
const depVar = "happiness";
const fixFactor = ["gender"];
const randFactor = ["school"];
const allCovariates = ["age"];
const allVars = ["happiness", "gender", "school", "age", "weight"];

const validConfig = {
    main: {
        DepVar: depVar,
        FixFactor: fixFactor,
        RandFactor: randFactor,
        Covar: allCovariates,
        WlsWeight: "weight",
    },
    model: {
        NonCust: true,
        Custom: false,
        BuildCustomTerm: false,
        FactorsVar: [...fixFactor, ...randFactor],
        TermsVar: null,
        FactorsModel: null,
        CovModel: null,
        RandomModel: null,
        BuildTermMethod: "interaction",
        TermText: null,
        SumOfSquareMethod: "typeIII",
        Intercept: true,
    },
    contrast: {
        FactorList: fixFactor.map((f) => `${f} (polynomial)`),
        ContrastMethod: "polynomial",
        Last: true,
        First: false,
    },
    plots: {
        SrcList: fixFactor,
        AxisList: null,
        LineList: null,
        PlotList: null,
        FixFactorVars: null,
        RandFactorVars: null,
        LineChartType: true,
        BarChartType: false,
        IncludeErrorBars: false,
        ConfidenceInterval: true,
        StandardError: false,
        Multiplier: 2,
        IncludeRefLineForGrandMean: false,
        YAxisStart0: false,
    },
    posthoc: {
        SrcList: fixFactor,
        FixFactorVars: null,
        ErrorRatio: 100,
        Twosided: true,
        LtControl: false,
        GtControl: false,
        CategoryMethod: "last",
        Waller: false,
        Dunnett: false,
        Lsd: false,
        Bonfe: false,
        Sidak: false,
        Scheffe: false,
        Regwf: false,
        Regwq: false,
        Snk: false,
        Tu: false,
        Tub: false,
        Dun: false,
        Hoc: false,
        Gabriel: false,
        Tam: false,
        Dunt: false,
        Games: false,
        Dunc: false,
    },
    emmeans: {
        SrcList: fixFactor,
        TargetList: [
            "(OVERALL)",
            ...fixFactor,
            fixFactor.length > 1 ? `${fixFactor[0]}*${fixFactor[1]}` : "",
            fixFactor.length > 2
                ? `${fixFactor[0]}*${fixFactor[1]}*${fixFactor[2]}`
                : "",
        ].filter(Boolean),
        CompMainEffect: true,
        ConfiIntervalMethod: "lsdNone",
    },
    save: {
        UnstandardizedPre: true,
        WeightedPre: true,
        StdStatistics: true,
        CooksD: true,
        Leverage: true,
        UnstandardizedRes: true,
        WeightedRes: true,
        StandardizedRes: true,
        StudentizedRes: true,
        DeletedRes: true,
        CoeffStats: false,
        StandardStats: false,
        Heteroscedasticity: false,
        NewDataSet: true,
        FilePath: null,
        DatasetName: null,
        WriteNewDataSet: false,
    },
    options: {
        DescStats: true,
        HomogenTest: true,
        EstEffectSize: true,
        SprVsLevel: false,
        ObsPower: true,
        ResPlot: false,
        ParamEst: true,
        LackOfFit: true,
        TransformMat: false,
        GeneralFun: true,
        ModBruschPagan: true,
        FTest: true,
        BruschPagan: true,
        WhiteTest: true,
        ParamEstRobStdErr: true,
        HC0: false,
        HC1: false,
        HC2: false,
        HC3: false,
        HC4: false,
        CoefficientMatrix: true,
        SigLevel: 0.05,
    },
    bootstrap: {
        PerformBootStrapping: false,
        NumOfSamples: 1000,
        Seed: false,
        SeedValue: 200000,
        Level: 95,
        Percentile: true,
        BCa: false,
        Simple: true,
        Stratified: false,
        Variables: allVars,
        StrataVariables: null,
    },
    updatedAt: new Date().toISOString(),
};

const invalidConfig = {
    // Properti 'main' sengaja dihilangkan untuk memicu error parsing
};

// --- Helper untuk Menjalankan Test ---
const runAnalysisTest = async ({
    depData = validDepData,
    fixFactorData = validFixFactorData,
    randFactorData = validRandFactorData,
    covarData = validCovarData,
    wlsData = validWlsData,
    depDefs = validDepDefs,
    fixFactorDefs = validFixFactorDefs,
    randFactorDefs = validRandFactorDefs,
    covarDefs = validCovarDefs,
    wlsDefs = validWlsDefs,
    config = validConfig,
}: {
    depData?: any;
    fixFactorData?: any;
    randFactorData?: any;
    covarData?: any;
    wlsData?: any;
    depDefs?: any;
    fixFactorDefs?: any;
    randFactorDefs?: any;
    covarDefs?: any;
    wlsDefs?: any;
    config?: any;
}) => {
    let error: any | null = null;
    try {
        new UnivariateAnalysis(
            depData,
            fixFactorData,
            randFactorData,
            covarData,
            wlsData,
            depDefs,
            fixFactorDefs,
            randFactorDefs,
            covarDefs,
            wlsDefs,
            config
        );
    } catch (e: any) {
        error = e;
    }
    return error;
};

// --- Suite Pengujian Integrasi Konstruktor Univariate ---
describe("Univariate Analysis Constructor Integration Test", () => {
    beforeAll(async () => {
        const wasmPath = path.join(__dirname, "../rust/pkg/wasm_bg.wasm");
        const wasmBuffer = fs.readFileSync(wasmPath);
        await init(wasmBuffer);
    });

    it("T01: Harus berhasil saat seluruh data input dan konfigurasi valid", async () => {
        const error = await runAnalysisTest({}); // Menggunakan semua data valid default
        expect(error).toBeNull();
    });

    it("T02: Harus error parsing saat dependent_data tidak sesuai format", async () => {
        const error = await runAnalysisTest({ depData: invalidFormatData });
        expect(error).toContain("Failed to parse dependent data");
    });

    it("T03: Harus error saat semua variabel independen (fixed, random, covariate) kosong", async () => {
        const configForT03 = {
            ...validConfig,
            main: {
                ...validConfig.main,
                FixFactor: [],
                RandFactor: [],
                Covar: [],
            },
        };

        const error = await runAnalysisTest({
            config: configForT03,
            fixFactorData: [],
            randFactorData: [],
            covarData: [],
            fixFactorDefs: [],
            randFactorDefs: [],
            covarDefs: [],
        });
        expect(error).toBe(
            "At least one fixed factor, random factor, or covariate must be provided"
        );
    });

    describe("T04: Validasi error parsing untuk setiap variabel", () => {
        it("Harus error parsing saat fixed_factor_data tidak sesuai format", async () => {
            const error = await runAnalysisTest({
                fixFactorData: invalidFormatData,
            });
            expect(error).toContain("Failed to parse fixed factor data");
        });

        it("Harus error parsing saat random_factor_data tidak sesuai format", async () => {
            const error = await runAnalysisTest({
                randFactorData: invalidFormatData,
            });
            expect(error).toContain("Failed to parse random factor data");
        });

        it("Harus error parsing saat covariate_data tidak sesuai format", async () => {
            const error = await runAnalysisTest({
                covarData: invalidFormatData,
            });
            expect(error).toContain("Failed to parse covariate data");
        });

        it("Harus error parsing saat wls_data tidak sesuai format", async () => {
            const error = await runAnalysisTest({ wlsData: invalidFormatData });
            expect(error).toContain("Failed to parse WLS weight data");
        });

        it("Harus error parsing saat dependent_data_defs tidak sesuai format", async () => {
            const error = await runAnalysisTest({ depDefs: invalidDefsFormat });
            expect(error).toContain(
                "Failed to parse dependent data definitions"
            );
        });
    });

    it("T05: Harus error saat dependent data hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({ depData: allNullData });
        expect(error).toBe("Dependent data contains all null values");
    });

    it("T06: Harus error saat fixed factor hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({ fixFactorData: allNullData });
        expect(error).toBe("Fixed factor data contains all null values");
    });

    it("T07: Harus error saat random factor hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({ randFactorData: allNullData });
        expect(error).toBe("Random factor data contains all null values");
    });

    it("T08: Harus error saat covariate hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({ covarData: allNullData });
        expect(error).toBe("Covariate data contains all null values");
    });

    it("T09: Harus error saat wls data hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({ wlsData: allNullData });
        expect(error).toBe("WLS data contains all null values");
    });

    it("T10: Harus error parsing saat config_data tidak valid", async () => {
        const error = await runAnalysisTest({ config: invalidConfig });
        expect(error).toContain("Failed to parse configuration");
    });
});
