"use client";
import React, { useState, useEffect, FC } from "react";
import { Button } from "@/components/ui/button";
import {
DialogContent,
DialogFooter,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog";
import {
Tabs,
TabsContent,
TabsList,
TabsTrigger
} from "@/components/ui/tabs";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";

interface TwoRelatedSamplesModalProps {
onClose: () => void;
}

const Index: FC<TwoRelatedSamplesModalProps> = ({ onClose }) => {
const [activeTab, setActiveTab] = useState("variables");
const [listVariables, setListVariables] = useState<Variable[]>([]);
const [testVariables1, setTestVariables1] = useState<Variable[]>([]);
const [testVariables2, setTestVariables2] = useState<Variable[]>([]);
const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected1' | 'selected2', rowIndex?: number} | null>(null);
const [selectedPair, setSelectedPair] = useState<number | null>(null);

const [testType, setTestType] = useState({
    wilcoxon: true,
    sign: false,
    mcNemar: false,
    marginalHomogeneity: false
});

const [displayStatistics, setDisplayStatistics] = useState({
    descriptive: false,
    quartiles: false,
});

const [isCalculating, setIsCalculating] = useState<boolean>(false);
const [errorMsg, setErrorMsg] = useState<string | null>(null);

const variables = useVariableStore.getState().variables;
const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

// Initialize available variables on component mount
useEffect(() => {
    const validVars = variables.filter(v => v.name !== "");
    setListVariables(validVars);
}, [variables]);

const handleSelectedVariable = (variable: Variable, targetList: 'list1' | 'list2') => {
    // Cek untuk menemukan slot kosong di testVariables1 atau testVariables2
    const emptySlot1 = testVariables1.findIndex(v => v === undefined);
    const emptySlot2 = testVariables2.findIndex(v => v === undefined);
    
    // Jika ada slot kosong
    if (emptySlot1 !== -1 || emptySlot2 !== -1) {
        // Prioritaskan untuk mengisi slot kosong dengan urutan: pair terkecil, variable1, variable2
        if (emptySlot1 !== -1 && (emptySlot1 < emptySlot2 || emptySlot2 === -1)) {
            // Periksa apakah variable ini sudah ada di variable2 pada pair yang sama
            if (testVariables2[emptySlot1] && testVariables2[emptySlot1].columnIndex === variable.columnIndex) {
                setErrorMsg("The pair must contain two different variables.");
                return;
            }
            
            // Isi slot kosong di variable1
            setTestVariables1(prev => {
                const newArray = [...prev];
                newArray[emptySlot1] = variable;
                return newArray;
            });
            setErrorMsg(null);
        } else if (emptySlot2 !== -1) {
            // Periksa apakah variable ini sudah ada di variable1 pada pair yang sama
            if (testVariables1[emptySlot2] && testVariables1[emptySlot2].columnIndex === variable.columnIndex) {
                setErrorMsg("The pair must contain two different variables.");
                return;
            }
            
            // Isi slot kosong di variable2
            setTestVariables2(prev => {
                const newArray = [...prev];
                newArray[emptySlot2] = variable;
                return newArray;
            });
            setErrorMsg(null);
        }
    } else {
        // Jika tidak ada slot kosong, tambahkan ke array yang sesuai
        if (targetList === 'list1') {
            // Periksa apakah variable ini sudah ada di variable2 dengan indeks sama
            if (testVariables2.length > 0 && 
                testVariables2[testVariables1.length] && 
                testVariables2[testVariables1.length].columnIndex === variable.columnIndex) {
                setErrorMsg("The pair must contain two different variables.");
                return;
            }
            
            setTestVariables1(prev => [...prev, variable]);
            setErrorMsg(null);
        } else {
            // Periksa apakah variable ini sudah ada di variable1 dengan indeks sama
            if (testVariables1.length > 0 && 
                testVariables1[testVariables2.length] && 
                testVariables1[testVariables2.length].columnIndex === variable.columnIndex) {
                setErrorMsg("The pair must contain two different variables.");
                return;
            }
            
            setTestVariables2(prev => [...prev, variable]);
            setErrorMsg(null);
        }
    }
    
    // Tidak menghapus variabel dari listVariables sehingga tetap tersedia
    setHighlightedVariable(null);
};

const handleDeselectVariable = (variable: Variable, sourceList: 'list1' | 'list2', rowIndex?: number) => {
    // Jika rowIndex diberikan, hapus variabel hanya pada baris tersebut
    if (rowIndex !== undefined) {
        if (sourceList === 'list1') {
            const otherVariable = testVariables2[rowIndex];
            
            // Cek apakah slot di variable2 kosong
            if (!otherVariable) {
                // Hapus baris sepenuhnya - pair dibawahnya akan naik
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
            } else {
                // Jika variable2 tidak kosong, hanya kosongkan slot ini
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray[rowIndex] = undefined as any;
                    return newArray;
                });
            }
        } else { // sourceList === 'list2'
            const otherVariable = testVariables1[rowIndex];
            
            // Cek apakah slot di variable1 kosong
            if (!otherVariable) {
                // Hapus baris sepenuhnya - pair dibawahnya akan naik
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
            } else {
                // Jika variable1 tidak kosong, hanya kosongkan slot ini
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray[rowIndex] = undefined as any;
                    return newArray;
                });
            }
        }
    } else {
        // Perilaku lama, hapus semua instance variabel
        if (sourceList === 'list1') {
            setTestVariables1(prev => prev.filter(v => v && v.columnIndex !== variable.columnIndex));
        } else {
            setTestVariables2(prev => prev.filter(v => v && v.columnIndex !== variable.columnIndex));
        }
    }
    
    setHighlightedVariable(null);
};

const handleMoveVariableBetweenLists = (index: number) => {
    // Move variable from list1 to list2 or vice versa
    const temp = testVariables1[index];
    setTestVariables1(prev => {
        const newArray = [...prev];
        newArray[index] = testVariables2[index];
        return newArray;
    });
    setTestVariables2(prev => {
        const newArray = [...prev];
        newArray[index] = temp;
        return newArray;
    });
};

const handleMoveUpPair = (index: number) => {
    if (index > 0) {
        setTestVariables1(prev => {
            const newArray = [...prev];
            [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
            return newArray;
        });
        
        setTestVariables2(prev => {
            const newArray = [...prev];
            [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
            return newArray;
        });
        
        setSelectedPair(index - 1);
    }
};

const handleMoveDownPair = (index: number) => {
    if (index < testVariables1.length - 1) {
        setTestVariables1(prev => {
            const newArray = [...prev];
            [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
            return newArray;
        });
        
        setTestVariables2(prev => {
            const newArray = [...prev];
            [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
            return newArray;
        });
        
        setSelectedPair(index + 1);
    }
};

const handleRemovePair = (index: number) => {
    // Tidak perlu mengembalikan variabel ke listVariables karena variabel tidak dihapus
    
    setTestVariables1(prev => prev.filter((_, i) => i !== index));
    setTestVariables2(prev => prev.filter((_, i) => i !== index));
    setSelectedPair(null);
};

const isPairValid = (index: number): boolean => {
    // Pastikan kedua variabel di pair ada dan berbeda
    if (!testVariables1[index] || !testVariables2[index]) {
        return false;
    }
    
    // Cek apakah variabel berbeda (berdasarkan columnIndex)
    return testVariables1[index].columnIndex !== testVariables2[index].columnIndex;
};

const areAllPairsValid = (): boolean => {
    if (testVariables1.length === 0 || testVariables2.length === 0) {
        return false;
    }
    
    if (testVariables1.length !== testVariables2.length) {
        return false;
    }
    
    // Cek semua pair apakah valid
    for (let i = 0; i < testVariables1.length; i++) {
        if (!isPairValid(i)) {
            return false;
        }
    }
    
    return true;
};

const hasDuplicatePairs = (): boolean => {
    const pairSignatures = new Set<string>();
    
    for (let i = 0; i < testVariables1.length; i++) {
        if (testVariables1[i] && testVariables2[i]) {
            // Buat signature unik untuk setiap pasangan
            const var1Id = testVariables1[i].columnIndex;
            const var2Id = testVariables2[i].columnIndex;
            const pairSignature = `${var1Id}-${var2Id}`;
            
            // Cek apakah signature ini sudah ada
            if (pairSignatures.has(pairSignature)) {
                return true; // Ditemukan duplikat
            }
            
            pairSignatures.add(pairSignature);
        }
    }
    
    return false;
};

const handleReset = () => {
    setListVariables(variables.filter(v => v.name !== ""));
    setTestVariables1([]);
    setTestVariables2([]);
    setHighlightedVariable(null);
    setSelectedPair(null);
    setTestType({
        wilcoxon: true,
        sign: false,
        mcNemar: false,
        marginalHomogeneity: false
    });
    setDisplayStatistics({
        descriptive: false,
        quartiles: false,
    });
    setErrorMsg(null);
};

const handleRunTest = async () => {
    if (testVariables1.length < 1 || testVariables2.length < 1 || testVariables1.length !== testVariables2.length) {
        setErrorMsg("Please select at least one pair of variables.");
        return;
    }
    
    if (!areAllPairsValid()) {
        setErrorMsg("All pairs must contain two different variables.");
        return;
    }
    
    if (hasDuplicatePairs()) {
        setErrorMsg("The grid contains a duplicate pair.");
        return;
    }
    
    if (!testType.wilcoxon && !testType.sign && !testType.mcNemar && !testType.marginalHomogeneity) {
        setErrorMsg("Please select at least one test type.");
        return;
    }
    
    setErrorMsg(null);
    setIsCalculating(true);

    try {
        // 1. Prepare variable data using useDataStore's getVariableData
        const variableData1Promises = [];
        const variableData2Promises = [];
        
        for (const varDef of testVariables1) {
            variableData1Promises.push(useDataStore.getState().getVariableData(varDef));
        }
        
        for (const varDef of testVariables2) {
            variableData2Promises.push(useDataStore.getState().getVariableData(varDef));
        }
        
        const variableData1 = await Promise.all(variableData1Promises);
        const variableData2 = await Promise.all(variableData2Promises);

        // 2. Create worker and set up handlers
        const worker = new Worker("/workers/TwoRelatedSamples/index.js",  { type: 'module' });

        // Set a timeout to prevent worker hanging
        const timeoutId = setTimeout(() => {
            worker.terminate();
            setErrorMsg("Analysis timed out. Please try again with fewer variables.");
            setIsCalculating(false);
        }, 60000); // 60 second timeout

        worker.onmessage = async (e) => {
            clearTimeout(timeoutId);
            const wData = e.data;

            if (wData.success) {
                try {
                    // Save results to database
                    const variableNames1 = testVariables1.map(v => v.name);
                    const variableNames2 = testVariables2.map(v => v.name);
                    let logParts = ['NPAR TESTS'];

                    // Only add tests that are enabled
                    if (wData.testType.wilcoxon) {
                        logParts.push(`{WILCOXON=${variableNames1.join(" ")} WITH ${variableNames2.join(" ")} (PAIRED)}`);
                    }

                    if (wData.testType.sign) {
                        logParts.push(`{SIGN=${variableNames1.join(" ")} WITH ${variableNames2.join(" ")} (PAIRED)}`);
                    }

                    if (wData.testType.mcNemar) {
                        logParts.push(`{MCNEMAR=${variableNames1.join(" ")} WITH ${variableNames2.join(" ")} (PAIRED)}`);
                    }

                    if (wData.testType.marginalHomogeneity) {
                        logParts.push(`{MH=${variableNames1.join(" ")} WITH ${variableNames2.join(" ")} (PAIRED)}`);
                    }


                    if (wData.displayStatistics.descriptive && wData.displayStatistics.quartiles) {
                        logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
                    } else if (wData.displayStatistics.descriptive) {
                        logParts.push(`{STATISTICS DESCRIPTIVES}`);
                    } else if (wData.displayStatistics.quartiles) {
                        logParts.push(`{STATISTICS QUARTILES}`);
                    }

                    // Join all parts with spaces
                    let logMsg = logParts.join(' ');

                    // If no tests are selected, provide a default message
                    if (logParts.length === 1) {
                        logMsg = 'NPAR TESTS {No specific tests selected}';
                    }

                    const logId = await addLog({ log: logMsg });
                    const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: "" });

                    if (wData.displayStatistics.descriptive || wData.displayStatistics.quartiles) {
                        await addStatistic(analyticId, {
                            title: "Descriptive Statistics",
                            output_data: wData.descriptives,
                            components: "Descriptive Statistics",
                            description: ""
                        });
                    }

                    if (wData.testType.wilcoxon) {
                        await addStatistic(analyticId, {
                            title: "Ranks",
                            output_data: wData.ranks,
                            components: "Wilcoxon Signed Ranks Test",
                            description: ""
                        });

                        await addStatistic(analyticId, {
                            title: "Test Statistics",
                            output_data: wData.wilcoxonTest,
                            components: "Wilcoxon Signed Ranks Test",
                            description: ""
                        });
                    }

                    if (wData.testType.sign) {
                        await addStatistic(analyticId, {
                            title: "Frequencies",
                            output_data: wData.frequencies,
                            components: "Sign Test",
                            description: ""
                        });

                        await addStatistic(analyticId, {
                            title: "Test Statistics",
                            output_data: wData.signTest,
                            components: "Sign Test",
                            description: ""
                        });
                    }

                    setIsCalculating(false);
                    worker.terminate();
                    onClose();
                } catch (err) {
                    console.error(err);
                    setErrorMsg(`Error saving results.`);
                    setIsCalculating(false);
                    worker.terminate();
                }
            } else {
                setErrorMsg(wData.error || "Worker returned an error.");
                setIsCalculating(false);
                worker.terminate();
            }
        };

        worker.onerror = (event) => {
            clearTimeout(timeoutId);
            console.error("Worker error:", event);
            setIsCalculating(false);
            setErrorMsg("Worker error occurred. Check console for details.");
            worker.terminate();
        };

        // 3. Send data to worker - using the new format with variableData
        worker.postMessage({
            variableData1:variableData1,
            variableData2:variableData2,
            testType:testType,
            displayStatistics:displayStatistics
        });
    
    } catch (ex) {
        console.error(ex);
        setErrorMsg("Something went wrong.");
        setIsCalculating(false);
    }
};

return (
    <DialogContent className="max-w-[800px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
            <DialogTitle className="text-[22px] font-semibold">Two-Related-Samples Tests</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
            <div className="border-b border-[#E6E6E6] flex-shrink-0">
                <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                    <TabsTrigger
                        value="variables"
                        className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                    >
                        Variables
                    </TabsTrigger>
                    <TabsTrigger
                        value="options"
                        className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                    >
                        Options
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                <VariablesTab
                    listVariables={listVariables}
                    testVariables1={testVariables1}
                    testVariables2={testVariables2}
                    highlightedVariable={highlightedVariable}
                    setHighlightedVariable={setHighlightedVariable}
                    selectedPair={selectedPair}
                    setSelectedPair={setSelectedPair}
                    testType={testType}
                    setTestType={setTestType}
                    handleSelectedVariable={handleSelectedVariable}
                    handleDeselectVariable={handleDeselectVariable}
                    handleMoveVariableBetweenLists={handleMoveVariableBetweenLists}
                    handleMoveUpPair={handleMoveUpPair}
                    handleMoveDownPair={handleMoveDownPair}
                    handleRemovePair={handleRemovePair}
                />
            </TabsContent>

            <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                <OptionsTab
                    displayStatistics={displayStatistics}
                    setDisplayStatistics={setDisplayStatistics}
                />
            </TabsContent>
        </Tabs>

        {errorMsg && <div className="px-6 py-2 text-red-600">{errorMsg}</div>}
        
        <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
            <div className="flex justify-end space-x-3">
                <Button
                    className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                    onClick={handleRunTest}
                    disabled={
                        isCalculating ||
                        !areAllPairsValid() ||
                        (
                            !testType.wilcoxon &&
                            !testType.sign &&
                            !testType.mcNemar &&
                            !testType.marginalHomogeneity
                        )
                    }
                >
                    {isCalculating ? "Calculating..." : "OK"}
                </Button>
                <Button
                    variant="outline"
                    className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    onClick={handleReset}
                    disabled={isCalculating}
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    onClick={onClose}
                    disabled={isCalculating}
                >
                    Cancel
                </Button>
            </div>
        </DialogFooter>
    </DialogContent>
);
};

export default Index;