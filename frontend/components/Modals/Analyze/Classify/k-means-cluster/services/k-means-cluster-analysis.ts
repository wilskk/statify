import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
<<<<<<< HEAD
import { KMeansClusterAnalysisType } from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster-worker";
=======
import type { KMeansClusterAnalysisType } from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster-worker";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import { transformKMeansResult } from "./k-means-cluster-analysis-formatter";
import { resultKMeans } from "./k-means-cluster-analysis-output";
import init, {
    KMeansClusterAnalysis,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/rust/pkg/wasm";

export async function analyzeKMeansCluster({
    configData,
    dataVariables,
    variables,
}: KMeansClusterAnalysisType) {
    console.log(configData);
    const TargetVariables = configData.main.TargetVar || [];
    const CaseTargetVariable = configData.main.CaseTarget
        ? [configData.main.CaseTarget]
        : [];

    const slicedDataForTarget = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: TargetVariables,
    });

    const slicedDataForCaseTarget = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: CaseTargetVariable,
    });

    const varDefsForTarget = getVarDefs(variables, TargetVariables);
    const varDefsForCaseTarget = getVarDefs(variables, CaseTargetVariable);

    console.log("slicedDataForTarget", slicedDataForTarget);
    console.log("slicedDataForCaseTarget", slicedDataForCaseTarget);
    console.log("varDefsForTarget", varDefsForTarget);
    console.log("varDefsForCaseTarget", varDefsForCaseTarget);
    console.log("configData", configData);

    await init();
    const kmeans = new KMeansClusterAnalysis(
        slicedDataForTarget,
        slicedDataForCaseTarget,
        varDefsForTarget,
        varDefsForCaseTarget,
        configData
    );

    const results = kmeans.get_formatted_results();
    console.log("kmeans results", results);

    const errorsString = kmeans.get_all_errors();
    console.log("kmeans errors", errorsString);

    let errors: string[] = [];
    if (errorsString) {
        errors = errorsString
            .split("\n")
            .filter((line: string) => line.trim() !== "");
    }

    const formattedResults = transformKMeansResult(results ?? {}, errors);
    console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultKMeans({
        formattedResult: formattedResults ?? [],
        configData,
        variables,
    });
}
