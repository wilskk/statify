import init, {DickeyFuller, AugmentedDickeyFuller, get_t} from '@/components/Modals/Analyze/TimeSeries/wasm/pkg/wasm';

export async function handleUnitRootTest(
    data: (number)[], 
    dataHeader: (string), 
    method: (string),
    lag: (number),
    equation: (string),
    differencing: (string),
):Promise<[string, string, number[], string, string, string, string]> {
    await init(); // Inisialisasi WebAssembly
    const inputData = Array.isArray(data) ? data : null;
    
    if (!inputData) {
        throw new Error("Invalid input data");
    }

    try {
        if (!inputData.every((val) => typeof val === 'number')) {
            throw new Error("dataValues contains non-numeric values");
        }

        let unitroot;
        let methodName;
        
        if(method === "dickey-fuller"){
            unitroot = new DickeyFuller(new Float64Array(data), equation, differencing);
            methodName = "Dickey-Fuller";
        } else if(method === "augmented-dickey-fuller"){
            unitroot = new AugmentedDickeyFuller(new Float64Array(data), equation, differencing, lag);
            methodName = "Augmented Dickey-Fuller";
        } else {
            throw new Error("Invalid equation");
        }
        
<<<<<<< HEAD
        let adf_statistic = await unitroot.calculate_test_stat();
        let test = await get_t();
        // let test2 = await get_gamma_0_tab1();
        let critical_value = Array.from(await unitroot.calculate_critical_value());
        let adf_pvalue = await unitroot.calculate_pvalue() as number;
        let coeficient = Array.from(await unitroot.get_b_vec());
        let standard_error = Array.from(await unitroot.get_se_vec());
        let coef_pvalue = Array.from(await unitroot.get_p_value_vec());
        let coef_statistic = Array.from(await unitroot.get_test_stat_vec());
        let sel_crit = Array.from(await unitroot.get_sel_crit());

        // Testing
        let t: number[] = [];
        let difference: number[] = [];
        let x: number[] = [];
=======
        const adf_statistic = await unitroot.calculate_test_stat();
        const test = await get_t();
        // let test2 = await get_gamma_0_tab1();
        const critical_value = Array.from(await unitroot.calculate_critical_value());
        const adf_pvalue = await unitroot.calculate_pvalue() as number;
        const coeficient = Array.from(await unitroot.get_b_vec());
        const standard_error = Array.from(await unitroot.get_se_vec());
        const coef_pvalue = Array.from(await unitroot.get_p_value_vec());
        const coef_statistic = Array.from(await unitroot.get_test_stat_vec());
        const sel_crit = Array.from(await unitroot.get_sel_crit());

        // Testing
        const t: number[] = [];
        const difference: number[] = [];
        const x: number[] = [];
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        for (let i = 0; i < data.length - 1; i++) {
            t.push(i+1.0);
            difference.push(data[i+1] - data[i]);
            x.push(data[i]);
        }

        // Description Table
<<<<<<< HEAD
        let descriptionJSON = JSON.stringify({
=======
        const descriptionJSON = JSON.stringify({
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            tables: [
                {
                    title: `Description Table`,
                    columnHeaders: [{header:""},{header: 'description'}],
                    rows: [
                        {
                            rowHeader: [`Name Method`],
                            description: `${methodName}`,
                        },
                        {
                            rowHeader: [`Series Name`],
                            description: `${dataHeader}`,
                        },
                        {
                            rowHeader: [`Equation`],
                            description: `${equation}`,
                        },
                        {
                            rowHeader: [`Number of Lags`],
                            description: `${methodName === "Dickey-Fuller" ? 0 : lag}`,
                        },
                        {
                            rowHeader: [`Differencing`],
                            description: `${differencing === "level" ? "none" : differencing}`,
                        },
                        {
                            rowHeader: [`Probability Value`],
                            description: `Use MacKinnon (1996) one-sided p-values`,
                        },
                        {
                            rowHeader: [`Observations`],
                            description: `${data.length}`,
                        },
                        {
                            rowHeader: [`Number Observations After Computing`],
                            description: `${
                                differencing === 'first-difference' && methodName === "Augmented Dickey-Fuller"? data.length - 2 - lag : 
                                differencing === 'second-difference' && methodName === "Augmented Dickey-Fuller"? data.length - 3 - lag :
                                methodName === "Augmented Dickey-Fuller"? data.length - 1 - lag :
                                differencing === 'first-difference' ? data.length - 2 : 
                                differencing === 'second-difference' ? data.length - 3 : data.length - 1}`,
                        },
                    ],
                }
            ],
        });

<<<<<<< HEAD
        let adfJSON = JSON.stringify({
=======
        const adfJSON = JSON.stringify({
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            tables: [{
                title: `${methodName} Test Statistic`,
                columnHeaders: [{header: ""}, {header: ""}, {header: "t-statistic"}, {header: "p-value"}],
                rows: [{
                    "rowHeader": [`${methodName} Test`],
                    "t-statistic": `${adf_statistic.toFixed(3)}`,
                    "p-value": `${adf_pvalue.toFixed(3)}`,
                },{
                    "rowHeader": ["Critical Value"],
                    children:[{
                        "rowHeader": [null, "1%"],
                        "t-statistic": `${critical_value[0].toFixed(3)}`,
                    }, {
                        "rowHeader": [null, "5%"],
                        "t-statistic": `${critical_value[1].toFixed(3)}`,
                    }, {
                        "rowHeader": [null,"10%"],
                        "t-statistic": `${critical_value[2].toFixed(3)}`,
                    }],
                }]
            }]
        });

<<<<<<< HEAD
        let coefName = [];
=======
        const coefName = [];
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        if (equation === "no_trend" || equation === "with_trend") {
            coefName.push("Constant");
            if (method === "augmented-dickey-fuller") {
                for (let i = 1; i <= lag; i++) {
                    coefName.push(`${dataHeader} Diff Lag (${i})`);
                }
            }
            if (equation === "with_trend") {
                coefName.push("Trend");
            }
            coefName.push(`${dataHeader}`);
        } else {
            if (method === "augmented-dickey-fuller") {
                for (let i = 1; i <= lag; i++) {
                    coefName.push(`${dataHeader} Diff Lag (${i})`);
                }
            }
            coefName.push(`${dataHeader}`)
        }
<<<<<<< HEAD
        let coefStruct: Record<string, any> = {}; // Menggunakan objek kosong
=======
        const coefStruct: Record<string, any> = {}; // Menggunakan objek kosong
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        // Mengecek panjang seluruh data apakah sama
        if ((coefName.length + coeficient.length + standard_error.length + coef_pvalue.length + coef_statistic.length) % coeficient.length == 0) {
            for (let i = 0; i < coeficient.length; i++) {
                coefStruct[i] = { // Gunakan i sebagai key dalam objek
                    coefName: coefName[i],
                    coeficient: coeficient[i],
                    standard_error: standard_error[i],
                    coef_statistic: coef_statistic[i],
                    coef_pvalue: coef_pvalue[i]
                };
            }
        } else {
            throw new Error("Data length is not equal");
        }
<<<<<<< HEAD
        let coefJSON = JSON.stringify({
=======
        const coefJSON = JSON.stringify({
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            tables: [{
                title: "Coefficients Test",
                columnHeaders: [{header: ""}, {header: "coeficient"}, {header: "standard error"}, {header: "t-statistic"}, {header: "p-value"}],
                rows: Object.entries(coefStruct).map(([key, value]) => ({
                    "rowHeader": [value.coefName],
                    "coeficient": value.coeficient.toFixed(3),
                    "standard error": value.standard_error.toFixed(3),
                    "t-statistic": value.coef_statistic.toFixed(3),
                    "p-value": value.coef_pvalue.toFixed(3),
                })),
            }]
        });

<<<<<<< HEAD
        let sel_critName = equation ===  `no_constant` ? 
=======
        const sel_critName = equation ===  `no_constant` ? 
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        [
            `R-Squared`, `Adj. R-Squared`, `S.E. of Regression`,`Sum Squared Resid`,
            `Log Likelihood`, `Mean Dependent Var`, `S.D. Dependent Var`,
            `Akaike Info Crit`, `Schwarz Criterion`, `Hannan-Quinn`, `Durbin-Watson`
        ]
        :
        [
            `R-Squared`, `Adj. R-Squared`, `S.E. of Regression`,`Sum Squared Resid`,
            `Log Likelihood`, `F-Statistic`, `Prob(F-Stat)`, `Mean Dependent Var`, `S.D. Dependent Var`,
            `Akaike Info Crit`, `Schwarz Criterion`, `Hannan-Quinn`, `Durbin-Watson`
        ];
<<<<<<< HEAD
        let sel_critStruct: Record<string, any> = {}; // Menggunakan objek kosong
=======
        const sel_critStruct: Record<string, any> = {}; // Menggunakan objek kosong
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        // Mengecek panjang seluruh data apakah sama
        if (sel_critName.length === sel_crit.length) {
            for (let i = 0; i < sel_crit.length; i++) {
                sel_critStruct[i] = { // Gunakan i sebagai key dalam objek
                    sel_critName: sel_critName[i],
                    sel_critValue: sel_crit[i],
                };
            }
        } else {
            throw new Error("Data length is not equal");
        }
<<<<<<< HEAD
        let sel_critJSON = JSON.stringify({
=======
        const sel_critJSON = JSON.stringify({
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            tables: [{
                title: "Selection Criterion",
                columnHeaders: [{header: ""}, {header: "value"}],
                rows: Object.entries(sel_critStruct).map(([key, value]) => ({
                    "rowHeader": [value.sel_critName],
                    "value": value.sel_critValue.toFixed(3),
                })),
            }]
        });
        
        return ["success", descriptionJSON, [...critical_value, adf_statistic, ...coeficient, ...standard_error, adf_pvalue], adfJSON, coefJSON, sel_critJSON, methodName];
    } catch (error) {
<<<<<<< HEAD
        let errorMessage = error as Error;
        let errorJSON = JSON.stringify({
=======
        const errorMessage = error as Error;
        const errorJSON = JSON.stringify({
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            tables: [
                {
                    title: `Error Table`,
                    columnHeaders: [{header:""},{header: 'error'}],
                    rows: [
                        {
                            rowHeader: [`Error Message`],
                            description: `${errorMessage.message}`,
                        },
                    ],
                }
            ],
        });
        return ["error", errorJSON, [0], "", "", "", ""];
    }
}