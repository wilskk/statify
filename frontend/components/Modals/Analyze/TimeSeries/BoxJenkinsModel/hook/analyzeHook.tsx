import { useState } from "react";
import { Variable } from "@/types/Variable";
import { useResultStore } from "@/stores/useResultStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { handleBoxJenkinsModel } from "../analyze/analyze";

export function useAnalyzeHook(
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
    const { updateCells } = useDataStore();
    const { getTypeDate, getHour, getDay, getMonth, getYear, getDayName } = useTimeSeriesStore();

    const validateInputs = () => {
        if (!storeVariables.length) {
            return "Please select at least one variable.";
        }
        if (selectedPeriod[1] === "Not Dated") {
            return "Please select another time specification.";
        }
        if ((getDayName() === "Saturday" || getDayName() === "Sunday") && getTypeDate() === "wwd5") {
            return "5 Work days only available on weekdays (Monday to Friday).";
        }
        if (getDayName() === "Sunday" && getTypeDate() === "wwd6") {
            return "6 Work days only available on weekdays (Monday to Saturday).";
        }
        if ((getHour() < 8 || getHour() > 15) && getTypeDate() === "dwh") {
            return "Work hours only available between 8:00 and 15:00."; 
        }
        if (getHour() < 0 || getHour() > 23) {
            return "Hour must be between 0 and 23.";
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
        await updateCells(updates);
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

            const results = await handleBoxJenkinsModel(
                dataValues,
                dataVarDef.name,
                [arOrder, diffOrder, maOrder],
                checkedForecasting,
                Number(selectedPeriod[0]),
                getTypeDate(),
                getHour(),
                getDay(),
                getMonth(),
                getYear(),
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
