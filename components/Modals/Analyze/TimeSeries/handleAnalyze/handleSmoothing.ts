import init, {Smoothing} from '../../../../../src/wasm/pkg/wasm.js';
import {generateDate} from '../generateDate/generateDateTimeSeries';

export async function handleSmoothing(
    data: (number)[], 
    dataHeader: (string), 
    pars: (number)[], 
    periodicity: (number),
    typeDate: (string),
    startDate: (number),
    method: string): 
Promise<[number[], string, string]> {
    await init(); // Inisialisasi WebAssembly
    const inputData = Array.isArray(data)? data : null;
    
    if (!inputData) {
        throw new Error("Invalid input data");
    }

    try {
        if (!data.every((val) => typeof val === 'number')) {
            throw new Error("dataValues contains non-numeric values");
        }

        let smoothing;
        let smoothingValue;
        let nameMethod;
        
        smoothing = new Smoothing(dataHeader, new Float64Array(data));
        console.log("Smoothing initialized:", smoothing);
        switch (method) {
            case 'sma':
                smoothingValue = smoothing.calculate_sma(pars[0]);
                nameMethod = 'Simple Moving Average';
                break;
            case 'dma':
                smoothingValue = smoothing.calculate_dma(pars[0]);
                nameMethod = 'Double Moving Average';
                break;
            case 'ses':
                smoothingValue = smoothing.calculate_ses(pars[0]);
                nameMethod = 'Simple Exponential Smoothing';
                break;
            case 'des':
                smoothingValue = smoothing.calculate_des(pars[0]);
                nameMethod = 'Double Exponential Smoothing';
                break;
            case 'holt':
                smoothingValue = smoothing.calculate_holt(pars[0], pars[1]);
                nameMethod = 'Holt\'s Method';
                break;
            case 'winter':
                smoothingValue = smoothing.calculate_winter(pars[0], pars[1], pars[2], periodicity);
                nameMethod = 'Winter\'s Method';
                break;
            default:
                throw new Error(`Unknown method: ${method}`);
        }

        let smoothingArray = Array.from(smoothingValue);
        let smoothingRound = smoothingArray.map(value => Number(parseFloat(value.toString()).toFixed(3)));
        let structuredSmoothing: any[] = [];
        let dateArray = await generateDate(periodicity, typeDate, startDate, data.length);
        // Validasi panjang array
        if (data.length === smoothingArray.length) {
            for (let i = 0; i < data.length; i++) {
                structuredSmoothing.push({
                    category: `${dateArray[i]}`,
                    subcategory: `${dataHeader}`,
                    value: data[i],
                });
                structuredSmoothing.push({
                    category: `${dateArray[i]}`,
                    subcategory: `${nameMethod}`,
                    value: smoothingArray[i] === 0? null : smoothingArray[i],
                });
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let graphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Multiple Line Chart",
                    chartMetaData: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`${dataHeader}`, `$(nameMethod) Smoothing`],
                        },
                        description: `Smoothing ${dataHeader} using ${nameMethod}`,
                        notes: `Smoothing ${dataHeader}`,
                    },
                    chartData: structuredSmoothing,
                    chartConfig: {
                        "width": 800,
                        "height": 600,
                        "chartColor": ["#4682B4"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let evalValue = await smoothing.smoothing_evaluation(smoothingValue) as Record<string, number>;
        let evalJSON = JSON.stringify({
            tables: [
                {
                    title: `Smoothing Evaluation Results`,
                    columnHeaders: [{header:""},{header: 'value'}], 
                    rows: Object.entries(evalValue).map(([key, value]) => ({
                        rowHeader: [key], 
                        value: value.toFixed(3),     
                    })),
                },
            ],
        });
        return [smoothingRound, graphicJSON, evalJSON];
    } catch (error) {
        let errorMessage = error as Error;
        return [[0],"" ,JSON.stringify({ error: errorMessage.message })];
    }
}