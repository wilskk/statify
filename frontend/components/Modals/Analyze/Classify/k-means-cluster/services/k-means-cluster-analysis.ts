import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { KMeansClusterAnalysisType } from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster-worker";
import { transformKMeansResult } from "./k-means-cluster-analysis-formatter";
import { resultKMeans } from "./k-means-cluster-analysis-output";
import init, {KMeansClusterAnalysis} from "@/components/Modals/Analyze/Classify/k-means-cluster/rust/pkg/wasm";

export async function analyzeKMeansCluster({
    configData,
    dataVariables,
    variables,
}: KMeansClusterAnalysisType) {
    const TargetVariables = configData.main.TargetVar || [];
    const CaseTargetVariable = configData.main.CaseTarget
        ? [configData.main.CaseTarget]
        : [];

    const slicedDataForTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: TargetVariables,
    });

    const slicedDataForCaseTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CaseTargetVariable,
    });

    const varDefsForTarget = getVarDefs(variables, TargetVariables);
    const varDefsForCaseTarget = getVarDefs(variables, CaseTargetVariable);
    console.log(configData);

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

    const formattedResults = transformKMeansResult(results ?? {});
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
