import { useState } from "react";
import { handleSmoothing } from "../analyze/analyze";
import { useResultStore } from "@/stores/useResultStore"; // Untuk log dan statistik
import { useVariableStore } from "@/stores/useVariableStore"; // Untuk akses variabel
import { useDataStore } from "@/stores/useDataStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { Variable } from "@/types/Variable"; // Untuk tipe data variabel

export function useAnalyzeHook(
    selectedMethod: string[],
    parameters: number[],
    selectedPeriod: string[],
    storeVariables: Variable[], // Ini variabel yang dipilih user
    data: any[],
    saveForecasting: boolean,
    onClose: () => void
) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { addVariable, variables } = useVariableStore();
    const { updateCells } = useDataStore();
    const { getTypeDate, getHour, getDay, getMonth, getYear, getDayName} = useTimeSeriesStore();

    const validateInputs = () => {
        if (storeVariables.length === 0) {
            return "Please select at least one variable.";
        }
        if (selectedMethod[0] === "") {
            return "Please select a method.";
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
        if (selectedMethod[0] === "sma" && (parameters[0] < 1 || parameters[0] > 10)) {
            return "Simple Moving Average period must be between 1 and 10.";
        }
        if (selectedMethod[0] === "dma" && (parameters[0] < 1 || parameters[0] > 10)) {
            return "Double Moving Average period must be between 1 and 10.";
        }
        if (selectedMethod[0] === "ses" && (parameters[0] < 0 || parameters[0] > 1)) {
            return "Simple Exponential Smoothing alpha parameter must be between 0 and 1.";
        }
        if (selectedMethod[0] === "des" && (parameters[0] < 0 || parameters[0] > 1)) {
            return "Double Exponential Smoothing alpha parameter must be between 0 and 1.";
        }
        if (selectedMethod[0] === "holt" && (parameters[0] < 0 || parameters[0] > 1)) {
            return "Holt's method alpha parameter must be between 0 and 1.";
        }
        if (selectedMethod[0] === "holt" && (parameters[1] < 0 || parameters[1] > 1)) {
            return "Holt's method beta parameter must be between 0 and 1.";
        }
        if (selectedMethod[0] === "winter" && (parameters[0] < 0 || parameters[0] > 1)) {
            return "Winter's method alpha parameter must be between 0 and 1.";
        }
        if (selectedMethod[0] === "winter" && (parameters[1] < 0 || parameters[1] > 1)) {
            return "Winter's method beta parameter must be between 0 and 1.";
        }
        if (selectedMethod[0] === "winter" && (parameters[2] < 0 || parameters[2] > 1)) {
            return "Winter's method gamma parameter must be between 0 and 1.";
        }
        return null;
    };

    const prepareData = () => {
        // Ambil variabel data yang dipilih user (biasanya 1 variabel)
        const dataVarDef = storeVariables[0];
        if (!dataVarDef) throw new Error("Selected variable not found");
        if (dataVarDef.type !== "NUMERIC") throw new Error("Selected variable is not numeric");

        const dataValues = data.map((row: any) => {
            const val = row[dataVarDef.columnIndex];
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
        }).filter((v) => v !== null);

        return { dataValues, dataVarDef };
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
                throw new Error("No numeric data available for selected variable.");
            }
            if (dataValues.length < 20) {
                throw new Error("Data length must be at least 20 observations.");
            }
            // Validate periodicity and data length
            const periodicity = Number(selectedPeriod[0]);
            if (selectedMethod[0] === "winter" && dataValues.length < 4 * periodicity) {
                throw new Error("Data length is less than 4 times the periodicity.");
            }
            if (selectedMethod[0] === "winter" && dataValues.length % periodicity !== 0) {
                throw new Error("Data length is not a multiple of the periodicity.");
            }
            
            // Jalankan smoothing
            const [
                resultMessage,
                descriptionTable,
                smoothingResult,
                smoothingGraphic,
                smoothingEvaluation,
            ] = await handleSmoothing(
                dataValues,
                dataVarDef.name,
                parameters,
                parseInt(selectedPeriod[0]),
                getTypeDate(),
                getHour(),
                getDay(),
                getMonth(),
                getYear(),
                selectedMethod[0]
            );

            // Proses hasil smoothing (log, statistik, simpan variabel)
            await processSmoothingResults(
                resultMessage,
                descriptionTable,
                smoothingResult,
                smoothingGraphic,
                smoothingEvaluation,
                dataVarDef
            );

            setIsCalculating(false);
            onClose();
        } catch (ex) {
            setIsCalculating(false);
            setErrorMsg(ex instanceof Error ? ex.message : "An unknown error occurred.");
        }
    };

    const processSmoothingResults = async (
        resultMessage: string,
        descriptionTable: any,
        smoothingResult: any[],
        smoothingGraphic: any,
        smoothingEvaluation: any,
        dataVarDef: Variable
    ) => {
        console.log(smoothingGraphic);
        let parameterDesc = ``;
        switch (selectedMethod[0]) {
            case "sma": case "dma": case "ses": case "des":
                parameterDesc = `${parameters[0]}`;
                break;
            case "holt":
                parameterDesc = `${parameters[0]}, ${parameters[1]}`;
                break;
            case "winter":
                parameterDesc = `${parameters[0]}, ${parameters[1]}, ${parameters[2]}`;
                break;
        }
        // Buat log
        const logMsg = `SMOOTHING: ${dataVarDef.label || dataVarDef.name} Using ${
            selectedMethod[1]
        } method with parameters: ${parameterDesc}`;
        const logId = await addLog({ log: logMsg });

        // Buat analytic
        const analyticId = await addAnalytic(logId, {
            title: `Smoothing ${selectedMethod[1]}`,
            note: "",
        });

        if (resultMessage === "error") {
            await addStatistic(analyticId, {
                title: "Smoothing Error",
                output_data: resultMessage,
                components: "Smoothing Error",
                description: "Error occurred during smoothing",
            });
        } else {
            // Tambah statistik
            await addStatistic(analyticId, {
                title: `Description Table`,
                output_data: descriptionTable,
                components: "Description Table",
                description: "-",
            });

            await addStatistic(analyticId, {
                title: `Smoothing Graphic`,
                output_data: smoothingGraphic,
                components: "Smoothing Graphic",
                description: "Smoothing result graphic",
            });

            await addStatistic(analyticId, {
                title: "Smoothing Evaluation",
                output_data: smoothingEvaluation,
                components: "Smoothing Evaluation",
                description: "Smoothing evaluation results",
            });

            if (saveForecasting) {
                await saveSmoothingResultsAsVariable(smoothingResult, dataVarDef);
            }
        }
    };

    const saveSmoothingResultsAsVariable = async (
        smoothingResult: any[],
        dataVarDef: Variable
    ) => {
        const newVarIndex = variables.length; // Assuming new variable is added at the end
        let paramString = "";
        switch(selectedMethod[0]){
            case "sma":
            case "dma":
            case "ses":
            case "des":
                paramString = parameters[0]?.toString();
                break;
            case "holt":
                paramString = `${parameters[0]}_${parameters[1]}`;
                break;
            case "winter":
                paramString = `${parameters[0]}_${parameters[1]}_${parameters[2]}`;
                break;
            default:
                paramString = "_";
        }
        const newVarName = `${dataVarDef.name} ${selectedMethod[0]}_${paramString}`;
        const newVarLabel = `${dataVarDef.label || dataVarDef.name} (${selectedMethod[0]})`;

        const smoothingVariable: Partial<Variable> = {
            name: newVarName,
            columnIndex: newVarIndex,
            type: "NUMERIC",
            label: newVarLabel,
            values: [],
            missing: null,
            measure: "scale",
            width: 8,
            decimals: 2,
            columns: 100,
            align: "right",
        };

        await addVariable(smoothingVariable);

        // Update bulk cells
        const updates = [];

        for (let rowIndex = 0; rowIndex < smoothingResult.length; rowIndex++) {
            if (smoothingVariable.columnIndex !== undefined) {
                updates.push({
                row: rowIndex,
                col: smoothingVariable.columnIndex,
                value: smoothingResult[rowIndex].toString(),
                });
            }
        }

        if (updates.length > 0) {
            await updateCells(updates);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
}
