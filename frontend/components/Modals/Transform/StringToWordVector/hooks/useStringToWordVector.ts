import { useState, useEffect } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";

export const useStringToWordVector = () => {
    const variablesStore = useVariableStore(state => state.variables);
    
    // UI selection state
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<Variable | null>(null);

    // Initial load: filter text/nominal variables
    useEffect(() => {
        const stringVars = variablesStore.filter((v) => v.type === "STRING" || v.measure === "nominal");
        if (selectedVariable) {
            setAvailableVariables(stringVars.filter(v => v.id !== selectedVariable.id));
        } else {
            setAvailableVariables(stringVars);
        }
    }, [variablesStore, selectedVariable]);

    // Move handlers
    const moveToTarget = () => {
        if (highlightedVariable) {
            setSelectedVariable(highlightedVariable);
            setHighlightedVariable(null);
        }
    };

    const removeTarget = () => {
        setSelectedVariable(null);
    };

    // Configuration state
    const [config, setConfig] = useState({
        lowercase: true,
        stopwords: {
            method: "none", // none, indonesian, english, custom
            customList: "ada\nadalah\nadanya\nadapun\nagak\nagaknya\nagar\nakan\nakankah\nakhir\nakhiri"
        },
        stemming: {
            method: "none", // none, indonesian, english
        },
        tokenizer: {
            type: "word", // word, ngram
            minSize: 1,
            maxSize: 2,
        },
        delimiters: "\\r\\n\\t.,;:'\"()?!",
        vectorizationMethod: "tfidf", // binary, wordCount, tf, idf, tfidf
    });
    
    return {
        // Variable Context
        availableVariables,
        selectedVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToTarget,
        removeTarget,

        // Options Context
        config,
        setConfig
    }
}