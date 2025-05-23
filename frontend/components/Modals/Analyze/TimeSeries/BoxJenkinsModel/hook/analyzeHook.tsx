import { useState } from "react";
import { Variable } from "@/types/Variable";
import { useResultStore } from "@/stores/useResultStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { handleBoxJenkinsModel } from "../analyze/analyze";

export function analyzeHook(
    storeVariables: Variable[],
    data: any[],
    selectedPeriod: string[],
    arOrder: number,
    diffOrder: number,
    maOrder: number,
    checkedForecasting: boolean,
    onClose: () => void
) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { addVariable, variables } = useVariableStore();
    const { updateBulkCells } = useDataStore();
    const { getTypeDate, getYear, getWeek, getDay, setTypeDate } = useTimeSeriesStore();

    const validateInputs = () => {
        if (!storeVariables.length) {
            return "Please select at least one variable.";
        }
        if (selectedPeriod[1] === "Not Dated") {
            return "Please select another time specification.";
        }
        return null;
    };

    const prepareData = () => {
        const dataVarDef = storeVariables[0];
        if (!dataVarDef) {
            throw new Error("Selected variables not found");
        }
        if (dataVarDef.type !== "NUMERIC") {
            throw new Error("Selected variable is not numeric");
        }

        // Find last data row
        let maxIndex = -1;
        const selectedVars = [dataVarDef];
        data.forEach((row: any, idx: number) => {
            let hasData = false;
            for (const v of selectedVars) {
                if (row[v.columnIndex] !== null && row[v.columnIndex] !== "") {
                hasData = true;
                break;
                }
            }
            if (hasData) maxIndex = idx;
        });
        if (maxIndex < 0) maxIndex = 0;

        const dataValues: number[] = [];
        for (let i = 0; i <= maxIndex; i++) {
            const val = data[i][dataVarDef.columnIndex];
            const num = parseFloat(val);
            if (!isNaN(num)) dataValues.push(num);
        }

        return { dataValues, dataVarDef };
    };

    const saveForecastingAsVariable = async (forecast: any[], dataVarDef: Variable) => {
        const newVarIndex = variables.length;
        const newVarName = `${dataVarDef.name} ARIMA (${arOrder},${diffOrder},${maOrder})`;

        const forecastingVariable: Partial<Variable> = {
            name: newVarName,
            columnIndex: newVarIndex,
            type: "NUMERIC",
            label: `${dataVarDef.label || dataVarDef.name} ARIMA (${arOrder},${diffOrder},${maOrder})`,
            values: [],
            missing: null,
            measure: "scale",
            width: 8,
            decimals: 3,
            columns: 100,
            align: "right",
        };

        await addVariable(forecastingVariable);

        const updates = [];
        for (let i = 0; i < forecast.length; i++) {
            if (forecastingVariable.columnIndex !== undefined) {
                updates.push({
                row: i,
                col: forecastingVariable.columnIndex,
                value: forecast[i].toString(),
                });
            }
        }

        if (updates.length > 0) {
        await updateBulkCells(updates);
        }
    };

    const processResults = async (results: any[], dataVarDef: Variable) => {
        const [descriptionTable, test, coefficient, criteria, evaluation, forecast, graphic] = results;

        const logMsg = `ARIMA(${arOrder},${diffOrder},${maOrder}) ${dataVarDef.label || dataVarDef.name}.`;
        const logId = await addLog({ log: logMsg });
        const analyticId = await addAnalytic(logId, {
            title: `ARIMA(${arOrder},${diffOrder},${maOrder})`,
            note: "",
        });

        await addStatistic(analyticId, {
            title: "Description Table",
            output_data: descriptionTable,
            components: "Description Table",
            description: "",
        });
        await addStatistic(analyticId, {
            title: `Coefficient Test for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            output_data: coefficient,
            components: `Coefficient Test for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            description: "",
        });
        await addStatistic(analyticId, {
            title: `Criteria Selection for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            output_data: criteria,
            components: `Criteria Selection for ARIMA(${arOrder},${diffOrder},${maOrder})`,
            description: "",
        });

        if (checkedForecasting) {
            await addStatistic(analyticId, {
                title: `Graphic Forecasting for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                output_data: graphic,
                components: `Graphic Forecasting for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                description: "",
            });
            await addStatistic(analyticId, {
                title: `Forecasting Evaluation for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                output_data: evaluation,
                components: `Forecasting Evaluation for ARIMA(${arOrder},${diffOrder},${maOrder})`,
                description: "",
            });
            await saveForecastingAsVariable(forecast, dataVarDef);
        }
    };

    const handleAnalyzes = async () => {
        const validationError = validateInputs();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        try {
            const { dataValues, dataVarDef } = prepareData();

            if (dataValues.length === 0) {
                throw new Error("No data available for the selected variables.");
            }
            if (dataValues.length < 20) {
                throw new Error("Data length is less than 20 observations.");
            }

            let startDate: number;
            switch (getTypeDate()) {
                case "y":
                case "ys":
                case "yq":
                case "ym":
                    startDate = getYear();
                    break;
                case "wwd5":
                case "wwd6":
                case "wd":
                    startDate = getWeek();
                    break;
                case "dwh":
                case "dh":
                    startDate = getDay();
                    break;
                default:
                    startDate = 0;
            }

            const results = await handleBoxJenkinsModel(
                dataValues,
                dataVarDef.name,
                [arOrder, diffOrder, maOrder],
                checkedForecasting,
                Number(selectedPeriod[0]),
                getTypeDate(),
                startDate
            );

            await processResults(results, dataVarDef);

            setIsCalculating(false);
            onClose();
        } catch (ex) {
            setErrorMsg(ex instanceof Error ? ex.message : "An unknown error occurred.");
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
}
