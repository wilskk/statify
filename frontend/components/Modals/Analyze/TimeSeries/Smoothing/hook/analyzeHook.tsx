import { useState } from "react";
import { handleSmoothing } from "../analyze/analyze";
import { useResultStore } from "@/stores/useResultStore"; // Untuk log dan statistik
import { useVariableStore } from "@/stores/useVariableStore"; // Untuk akses variabel
import { useDataStore } from "@/stores/useDataStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";
import { Variable } from "@/types/Variable"; // Untuk tipe data variabel

export function analyzeHook(
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
    const { updateBulkCells } = useDataStore();
    const { getTypeDate, getYear, getWeek, getDay, setTypeDate } = useTimeSeriesStore();

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
        return null;
    };

    const prepareData = () => {
        // Ambil variabel data yang dipilih user (biasanya 1 variabel)
        const dataVarDef = storeVariables[0];
        if (!dataVarDef) {
            throw new Error("Selected variable not found");
        }

        const dataValues = data.map((row: any) => {
            const val = row[dataVarDef.columnIndex];
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
        }).filter((v) => v !== null);

        if (dataValues.length === 0) {
        throw new Error("No numeric data available for selected variable.");
        }

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

            // Tentukan startDate sesuai periode waktu
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

            // Jalankan smoothing
            const [
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
                startDate,
                selectedMethod[0]
            );

            // Proses hasil smoothing (log, statistik, simpan variabel)
            await processSmoothingResults(
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
        descriptionTable: any,
        smoothingResult: any[],
        smoothingGraphic: any,
        smoothingEvaluation: any,
        dataVarDef: Variable
    ) => {
        // Buat log
        const logMsg = `SMOOTHING: ${dataVarDef.label || dataVarDef.name} Using ${
            selectedMethod[1]
        } method with parameters: ${parameters.join(", ")}`;
        const logId = await addLog({ log: logMsg });

        // Buat analytic
        const analyticId = await addAnalytic(logId, {
            title: `Smoothing ${selectedMethod[1]}`,
            note: "",
        });

        // Tambah statistik
        await addStatistic(analyticId, {
            title: `Description Table`,
            output_data: descriptionTable,
            components: "Description Table",
            description: "",
        });

        await addStatistic(analyticId, {
            title: `Smoothing Graphic`,
            output_data: smoothingGraphic,
            components: "Smoothing Graphic",
            description: "",
        });

        await addStatistic(analyticId, {
            title: "Smoothing Evaluation",
            output_data: smoothingEvaluation,
            components: "Smoothing Evaluation",
            description: "",
        });

        if (saveForecasting) {
            await saveSmoothingResultsAsVariable(smoothingResult, dataVarDef);
        }
    };

    const saveSmoothingResultsAsVariable = async (
        smoothingResult: any[],
        dataVarDef: Variable
    ) => {
        const newVarIndex = variables.length; // Assuming new variable is added at the end
        const newVarName = `${dataVarDef.name} ${selectedMethod[0]}_${parameters.join("_")}`;
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
            await updateBulkCells(updates);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
}
