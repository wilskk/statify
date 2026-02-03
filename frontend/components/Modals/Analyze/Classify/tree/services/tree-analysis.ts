import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {TreeAnalysisType} from "@/components/Modals/Analyze/Classify/tree/types/tree-worker";
=======
import type {TreeAnalysisType} from "@/components/Modals/Analyze/Classify/tree/types/tree-worker";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export async function analyzeTree({
    configData,
    dataVariables,
    variables,
}: TreeAnalysisType) {
    const DependentVariable = configData.main.DependentTargetVar
        ? [configData.main.DependentTargetVar]
        : [];
    const IndependentVariables = configData.main.IndependentTargetVar || [];
    const InfluenceVariable = configData.main.InfluenceTargetVar
        ? [configData.main.InfluenceTargetVar]
        : [];
    const slicedDataForDependent = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: DependentVariable,
    });

    const slicedDataForIndependent = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: IndependentVariables,
    });

    const slicedDataForInfluence = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: InfluenceVariable,
    });

    const varDefsForDependent = getVarDefs(variables, DependentVariable);
    const varDefsForIndependent = getVarDefs(variables, IndependentVariables);
    const varDefsForInfluence = getVarDefs(variables, InfluenceVariable);

    console.log(configData);
}
