import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import type {KNNAnalysisType} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor-worker";

export async function analyzeKNN({
    configData,
    dataVariables,
    variables,
}: KNNAnalysisType) {
    const TargetVariable = configData.main.TargetVar
        ? [configData.main.TargetVar]
        : [];
    const FeaturesVariables = configData.main.FeatureVar || [];
    const FocalCaseIdentifierVariable = configData.main.FocalCaseIdenVar
        ? [configData.main.FocalCaseIdenVar]
        : [];
    const CaseIdentifierVariable = configData.main.CaseIdenVar
        ? [configData.main.CaseIdenVar]
        : [];

    const slicedDataForTarget = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: TargetVariable,
    });

    const slicedDataForFeatures = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: FeaturesVariables,
    });

    const slicedDataForFocalCaseIdentifier = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: FocalCaseIdentifierVariable,
    });

    const slicedDataForCaseIdentifier = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: CaseIdentifierVariable,
    });

    const varDefsForTarget = getVarDefs(variables, TargetVariable);
    const varDefsForFeatures = getVarDefs(variables, FeaturesVariables);
    const varDefsForFocalCaseIdentifier = getVarDefs(
        variables,
        FocalCaseIdentifierVariable
    );
    const varDefsForCaseIdentifier = getVarDefs(
        variables,
        CaseIdentifierVariable
    );

    console.log("configData", configData);

        // 🔥 TAMBAHAN: worker logic
    return new Promise((resolve, reject) => {
        console.log("Starting KNN Worker...");

        const worker = new Worker(
            "/workers/Classify/Nearest-Neighbor/nearestNeighbor.worker.js"
        );

        worker.onmessage = (e) => {
            console.log("Worker result:", e.data);

            if (e.data.error) {
                reject(e.data.error);
            } else {
                resolve(e.data.result);
            }

            worker.terminate();
        };

        worker.onerror = (err) => {
            console.error("Worker error:", err);
            reject(err);
            worker.terminate();
        };

        // 👉 kirim data ke worker (sementara kosong dulu juga gapapa)
        worker.postMessage({
            configData,
            slicedDataForTarget,
            slicedDataForFeatures,
        });
    });
    // await init();
    // const knn = new KNNAnalysis(
    //     slicedDataForTarget,
    //     slicedDataForFeatures,
    //     slicedDataForFocalCaseIdentifier,
    //     slicedDataForCaseIdentifier,
    //     varDefsForTarget,
    //     varDefsForFeatures,
    //     varDefsForFocalCaseIdentifier,
    //     varDefsForCaseIdentifier,
    //     configData
    // );

    // const results = knn.get_formatted_results();
    // const error = knn.get_all_errors();
    // const executed = knn.get_executed_functions();

    // console.log("knn results", results);
    // console.log("error", error);
    // console.log("executed", executed);

    // const formattedResults = transformNearestNeighborResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultNearestNeighbor({
    //     formattedResult: formattedResults ?? [],
    // });
    }
