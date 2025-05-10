"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useModalStore, ModalType } from "@/stores/useModalStore";
import { Button } from '@/components/ui/button';
import { File, Database, Loader2 } from 'lucide-react';
import { useDataStore, DataRow } from '@/stores/useDataStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable, ValueLabel, MissingValuesSpec, MissingRange } from '@/types/Variable';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const exampleSavFiles = [
    { name: 'tcm_kpi_upd.sav', path: '/exampleData/tcm_kpi_upd.sav' },
    { name: 'tcm_kpi.sav', path: '/exampleData/tcm_kpi.sav' },
    { name: 'anorectic.sav', path: '/exampleData/anorectic.sav' },
    { name: 'diabetes_costs.sav', path: '/exampleData/diabetes_costs.sav' },
    { name: 'aflatoxin.sav', path: '/exampleData/aflatoxin.sav' },
    { name: 'aflatoxin20.sav', path: '/exampleData/aflatoxin20.sav' },
    { name: 'accidents.sav', path: '/exampleData/accidents.sav' },
    { name: 'adl.sav', path: '/exampleData/adl.sav' },
    { name: 'advert.sav', path: '/exampleData/advert.sav' },
    { name: 'telco_extra.sav', path: '/exampleData/telco_extra.sav' },
    { name: 'Employee data.sav', path: '/exampleData/Employee data.sav' },
    { name: 'worldsales.sav', path: '/exampleData/worldsales.sav' },
    { name: 'cable_survey.sav', path: '/exampleData/cable_survey.sav' },
    { name: 'anticonvulsants.sav', path: '/exampleData/anticonvulsants.sav' },
    { name: 'stocks.sav', path: '/exampleData/stocks.sav' },
    { name: 'test_scores.sav', path: '/exampleData/test_scores.sav' },
    { name: 'insurance_claims.sav', path: '/exampleData/insurance_claims.sav' },
    { name: 'dmdata3.sav', path: '/exampleData/dmdata3.sav' },
    { name: 'customer_subset.sav', path: '/exampleData/customer_subset.sav' },
    { name: 'tv-survey.sav', path: '/exampleData/tv-survey.sav' },
    { name: 'dvdplayer.sav', path: '/exampleData/dvdplayer.sav' },
    { name: 'bankloan.sav', path: '/exampleData/bankloan.sav' },
    { name: 'credit_card.sav', path: '/exampleData/credit_card.sav' },
    { name: 'dmdata2.sav', path: '/exampleData/dmdata2.sav' },
    { name: 'car_sales_unprepared.sav', path: '/exampleData/car_sales_unprepared.sav' },
    { name: 'dmdata.sav', path: '/exampleData/dmdata.sav' },
    { name: 'shampoo_ph.sav', path: '/exampleData/shampoo_ph.sav' },
    { name: 'telco_missing.sav', path: '/exampleData/telco_missing.sav' },
    { name: 'customer_information.sav', path: '/exampleData/customer_information.sav' },
    { name: 'rfm_transactions.sav', path: '/exampleData/rfm_transactions.sav' },
    { name: 'ozone.sav', path: '/exampleData/ozone.sav' },
    { name: 'stroke_survival.sav', path: '/exampleData/stroke_survival.sav' },
    { name: 'bankloan_binning.sav', path: '/exampleData/bankloan_binning.sav' },
    { name: 'bankloan_cs.sav', path: '/exampleData/bankloan_cs.sav' },
    { name: 'bankloan_cs_noweights.sav', path: '/exampleData/bankloan_cs_noweights.sav' },
    { name: 'behavior.sav', path: '/exampleData/behavior.sav' },
    { name: 'behavior_ini.sav', path: '/exampleData/behavior_ini.sav' },
    { name: 'brakes.sav', path: '/exampleData/brakes.sav' },
    { name: 'breakfast.sav', path: '/exampleData/breakfast.sav' },
    { name: 'breakfast_overall.sav', path: '/exampleData/breakfast_overall.sav' },
    { name: 'broadband_1.sav', path: '/exampleData/broadband_1.sav' },
    { name: 'broadband_2.sav', path: '/exampleData/broadband_2.sav' },
    { name: 'carpet.sav', path: '/exampleData/carpet.sav' },
    { name: 'carpet_plan.sav', path: '/exampleData/carpet_plan.sav' },
    { name: 'car_insurance_claims.sav', path: '/exampleData/car_insurance_claims.sav' },
    { name: 'car_sales.sav', path: '/exampleData/car_sales.sav' },
    { name: 'carpet_prefs.sav', path: '/exampleData/carpet_prefs.sav' },
    { name: 'catalog.sav', path: '/exampleData/catalog.sav' },
    { name: 'catalog_seasfac.sav', path: '/exampleData/catalog_seasfac.sav' },
    { name: 'cellular.sav', path: '/exampleData/cellular.sav' },
    { name: 'ceramics.sav', path: '/exampleData/ceramics.sav' },
    { name: 'cereal.sav', path: '/exampleData/cereal.sav' },
    { name: 'clothing_defects.sav', path: '/exampleData/clothing_defects.sav' },
    { name: 'coffee.sav', path: '/exampleData/coffee.sav' },
    { name: 'contacts.sav', path: '/exampleData/contacts.sav' },
    { name: 'creditpromo.sav', path: '/exampleData/creditpromo.sav' },
    { name: 'cross_sell.sav', path: '/exampleData/cross_sell.sav' },
    { name: 'customer_dbase.sav', path: '/exampleData/customer_dbase.sav' },
    { name: 'debate.sav', path: '/exampleData/debate.sav' },
    { name: 'debate_aggregate.sav', path: '/exampleData/debate_aggregate.sav' },
    { name: 'demo.sav', path: '/exampleData/demo.sav' },
    { name: 'demo_cs.sav', path: '/exampleData/demo_cs.sav' },
    { name: 'demo_cs_1.sav', path: '/exampleData/demo_cs_1.sav' },
    { name: 'demo_cs_2.sav', path: '/exampleData/demo_cs_2.sav' },
    { name: 'dietstudy.sav', path: '/exampleData/dietstudy.sav' },
    { name: 'german_credit.sav', path: '/exampleData/german_credit.sav' },
    { name: 'grocery.sav', path: '/exampleData/grocery.sav' },
    { name: 'grocery_1month.sav', path: '/exampleData/grocery_1month.sav' },
    { name: 'grocery_1month_sample.sav', path: '/exampleData/grocery_1month_sample.sav' },
    { name: 'grocery_coupons.sav', path: '/exampleData/grocery_coupons.sav' },
    { name: 'guttman.sav', path: '/exampleData/guttman.sav' },
    { name: 'health_funding.sav', path: '/exampleData/health_funding.sav' },
    { name: 'hivassay.sav', path: '/exampleData/hivassay.sav' },
    { name: 'hourlywagedata.sav', path: '/exampleData/hourlywagedata.sav' },
    { name: 'insure.sav', path: '/exampleData/insure.sav' },
    { name: 'judges.sav', path: '/exampleData/judges.sav' },
    { name: 'kinship_dat.sav', path: '/exampleData/kinship_dat.sav' },
    { name: 'kinship_ini.sav', path: '/exampleData/kinship_ini.sav' },
    { name: 'kinship_var.sav', path: '/exampleData/kinship_var.sav' },
    { name: 'mallcost.sav', path: '/exampleData/mallcost.sav' },
    { name: 'marketvalues.sav', path: '/exampleData/marketvalues.sav' },
    { name: 'nhis2000_subset.sav', path: '/exampleData/nhis2000_subset.sav' },
    { name: 'offer.sav', path: '/exampleData/offer.sav' },
    { name: 'pain_medication.sav', path: '/exampleData/pain_medication.sav' },
    { name: 'patient_los.sav', path: '/exampleData/patient_los.sav' },
    { name: 'patlos_sample.sav', path: '/exampleData/patlos_sample.sav' },
    { name: 'poll_cs.sav', path: '/exampleData/poll_cs.sav' },
    { name: 'poll_cs_sample.sav', path: '/exampleData/poll_cs_sample.sav' },
    { name: 'poll_jointprob.sav', path: '/exampleData/poll_jointprob.sav' },
    { name: 'property_assess.sav', path: '/exampleData/property_assess.sav' },
    { name: 'property_assess_cs.sav', path: '/exampleData/property_assess_cs.sav' },
    { name: 'property_assess_cs_sample.sav', path: '/exampleData/property_assess_cs_sample.sav' },
    { name: 'recidivism.sav', path: '/exampleData/recidivism.sav' },
    { name: 'salesperformance.sav', path: '/exampleData/salesperformance.sav' },
    { name: 'satisf.sav', path: '/exampleData/satisf.sav' },
    { name: 'screws.sav', path: '/exampleData/screws.sav' },
    { name: 'ships.sav', path: '/exampleData/ships.sav' },
    { name: 'site.sav', path: '/exampleData/site.sav' },
    { name: 'smalldemo.sav', path: '/exampleData/smalldemo.sav' },
    { name: 'smokers.sav', path: '/exampleData/smokers.sav' },
];

const exampleFiles = {
    sav: exampleSavFiles,
    // Add other file types here if needed in the future e.g.
    // csv: [
    //     { name: 'example.csv', path: '/exampleData/example.csv' },
    // ]
};

// Helper function to map SPSS format types to our interface types
const mapSPSSTypeToInterface = (formatType: string): string => {
    const typeMap: { [key: string]: string } = {
        "F": "NUMERIC", "COMMA": "COMMA", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC";
};

// Helper function to convert SAV missing info to MissingValuesSpec
const convertSavMissingToSpec = (savMissing: any): MissingValuesSpec | null => {
    if (savMissing === null || savMissing === undefined) {
        return null;
    }

    // Case 1: Already an array (assume discrete)
    if (Array.isArray(savMissing)) {
        return savMissing.length > 0 ? { discrete: savMissing } : null;
    }

    // Case 2: Object that looks like a range {min?, max?}
    if (typeof savMissing === 'object' && (savMissing.hasOwnProperty('min') || savMissing.hasOwnProperty('max'))) {
        const range: MissingRange = {};
        if (savMissing.min !== undefined && typeof savMissing.min === 'number') {
            range.min = savMissing.min;
        }
        if (savMissing.max !== undefined && typeof savMissing.max === 'number') {
            range.max = savMissing.max;
        }
        // Only return range if at least one bound is valid
        return range.min !== undefined || range.max !== undefined ? { range } : null;
    }

    // Case 3: Single discrete value (string or number)
    if (typeof savMissing === 'string' || typeof savMissing === 'number') {
        return { discrete: [savMissing] };
    }

    // Fallback: Unknown format, treat as no missing values
    console.warn("Unknown SAV missing value format:", savMissing);
    return null;
};

export const ExampleDatasetModal = () => {
    const { modals, closeModal } = useModalStore();
    const { setDataAndSync, resetData } = useDataStore();
    const { setMeta: setProjectMeta, resetMeta: resetProjectMeta } = useMetaStore();
    const { overwriteVariables, resetVariables, setVariables } = useVariableStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentModal = modals[modals.length - 1];
    const isModalOpen = currentModal?.type === ModalType.ExampleDataset;

    const parseCSV = (content: string): Promise<DataRow[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(content, {
                header: false,
                skipEmptyLines: true,
                complete: (results: Papa.ParseResult<unknown>) => {
                    if (results.errors.length) {
                        const errorMsg = results.errors.map((err: Papa.ParseError) => err.message).join("; ");
                        reject(new Error(errorMsg));
                    } else {
                        const data = results.data as unknown[][];
                        if (data.length === 0) {
                            resolve([]);
                            return;
                        }
                        const sanitizedData = data.map(row => 
                            row.map(cell => (typeof cell === 'string' || typeof cell === 'number' ? cell : String(cell)))
                        );
                        const maxCols = Math.max(...sanitizedData.map(row => row.length));
                        const paddedData = sanitizedData.map(row => {
                            const newRow = [...row];
                            while (newRow.length < maxCols) {
                                newRow.push("");
                            }
                            return newRow;
                        });
                        resolve(paddedData as DataRow[]);
                    }
                },
                error: (error: Papa.ParseError) => {
                    reject(error);
                }
            } as Papa.ParseConfig<unknown>);
        });
    };

    const parseXLSX = (content: ArrayBuffer): Promise<DataRow[]> => {
        return new Promise((resolve, reject) => {
            try {
                const workbook = XLSX.read(content, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                resolve(jsonData as DataRow[]);
            } catch (err: unknown) {
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });
    };

    const generateDefaultVariables = (numCols: number): Variable[] => {
        const variables: Variable[] = [];
        for (let i = 0; i < numCols; i++) {
            variables.push({
                columnIndex: i,
                name: `VAR${String(i + 1).padStart(3, '0')}`,
                type: "NUMERIC",
                width: 8,
                decimals: 2,
                label: "",
                values: [],
                missing: null,
                columns: 64,
                align: "right",
                measure: "unknown",
                role: "input"
            });
        }
        return variables;
    };

    const handleFileClick = async (filePath: string) => {
        setIsLoading(true);
        setError(null);
        const fileName = filePath.split('/').pop() || 'Untitled Project';
        const fileExtension = filePath.split('.').pop()?.toLowerCase();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api'; // Get backend URL

        try {
            console.log("Fetching example file from path:", filePath);
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error fetching file! status: ${response.status}`);
            }

            let parsedData: DataRow[] = [];
            let variables: Variable[] = [];
            let fileToUseForMeta: { name: string, path: string } = { name: fileName, path: filePath }; // Keep track of file info

            if (fileExtension === 'csv') {
                const csvContent = await response.text();
                parsedData = await parseCSV(csvContent);
                if (parsedData.length > 0) {
                    variables = generateDefaultVariables(parsedData[0].length);
                }
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const arrayBuffer = await response.arrayBuffer();
                parsedData = await parseXLSX(arrayBuffer);
                 if (parsedData.length > 0) {
                    variables = generateDefaultVariables(parsedData[0].length);
                }
            } else if (fileExtension === 'sav') {
                const savBlob = await response.blob();
                const formData = new FormData();
                formData.append('file', savBlob, fileName);

                // Reset state *before* API call for SAV, consistent with OpenData
                await resetData();
                await resetVariables();
                // No meta reset here, will be set later

                const parseResponse = await fetch(`${backendUrl}/sav/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!parseResponse.ok) {
                    const errorText = await parseResponse.text();
                    throw new Error(`Backend error processing SAV: ${parseResponse.status} - ${errorText || 'Unknown error'}`);
                }

                const result = await parseResponse.json();
                if (!result.rows || !result.meta || !result.meta.sysvars) {
                    throw new Error('Invalid response structure from backend SAV upload endpoint.');
                }

                // --- Start: Logic copied and adapted from OpenData.tsx --- 
                const numCases = result.meta.header.n_cases;
                const numVars = result.meta.header.n_vars; // Use header n_vars
                const sysvars = result.meta.sysvars;

                variables = sysvars.map((varInfo: any, colIndex: number) => {
                    const variableName = varInfo.name || `VAR${colIndex + 1}`;
                    // Use optional chaining carefully, match OpenData
                    const formatType = varInfo.printFormat?.typestr; 
                    const isString = formatType === "A" || varInfo.type === 1;

                    const valueLabelsObj = result.meta.valueLabels?.find(
                        (vl: any) => vl.appliesToNames?.includes(variableName) // Use optional chaining
                    );

                    const valueLabels = valueLabelsObj ?
                        valueLabelsObj.entries.map((entry: any) => ({
                            id: undefined,
                            variableName,
                            value: entry.val,
                            label: entry.label
                        })) : [];

                    const missingSpec = convertSavMissingToSpec(varInfo.missing);

                    return {
                        columnIndex: colIndex,
                        name: variableName,
                        type: mapSPSSTypeToInterface(formatType), // Use helper function
                        width: varInfo.printFormat?.width, // Use optional chaining
                        decimals: varInfo.printFormat?.nbdec, // Use optional chaining
                        label: varInfo.label || "",
                        values: valueLabels,
                        missing: missingSpec, // Gunakan spec yang sudah dikonversi
                        columns: 200, // Match OpenData default
                        align: isString ? "left" : "right",
                        measure: isString ? "nominal" : "scale", // Match OpenData logic
                        role: "input"
                    };
                });

                parsedData = Array(numCases).fill(0).map((_, rowIndex) => {
                    const rowData = result.rows[rowIndex] || {};
                    // Ensure sysvars length is respected, match OpenData
                    return Array(numVars).fill(0).map((_, colIndex) => {
                        const colName = sysvars[colIndex]?.name; 
                        return rowData[colName] !== undefined ? rowData[colName] : "";
                    });
                });
                // --- End: Logic copied and adapted from OpenData.tsx --- 

            } else {
                throw new Error(`Unsupported file type: ${fileExtension}`);
            }

            // State updates outside the if/else block, after processing
            // Reset state just before setting new state (if not SAV)
            if (fileExtension !== 'sav') {
                await resetData();
                await resetVariables();
            }
            await resetProjectMeta(); // Reset meta for all types before setting new

            // Set project meta using the file info
            await setProjectMeta({ name: fileToUseForMeta.name, location: fileToUseForMeta.name, created: new Date() });

            // Set data and variables
            await setDataAndSync(parsedData);
            if (fileExtension === 'sav') {
                await overwriteVariables(variables); // Use overwrite for SAV
            } else {
                await setVariables(variables); // Use setVariables for others
            }

            setIsLoading(false);
            closeModal();
            router.push('/dashboard/data');

        } catch (err: any) {
            console.error("Error opening or processing example file:", err);
            const errorToSet = err instanceof Error ? err.message : String(err);
            setError(errorToSet || "Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        closeModal();
    };

    const renderFileList = (files: { name: string; path: string }[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {files.map((file) => (
                <Button
                    key={file.path}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleFileClick(file.path)}
                    disabled={isLoading}
                >
                    <File className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="truncate text-sm">{file.name}</span>
                </Button>
            ))}
        </div>
    );

    if (!isModalOpen) return null;

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px] bg-popover text-popover-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Database className="h-5 w-5 mr-2 text-primary"/> Dataset Contoh
                    </DialogTitle>
                    <DialogDescription>
                        Pilih dataset contoh (.sav) untuk memulai analisis. Data akan dimuat ke dalam proyek baru.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {isLoading && (
                        <div className="absolute inset-0 bg-popover/70 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-popover-foreground" />
                        </div>
                    )}
                    {error && (
                        <p className="text-destructive-foreground text-sm px-4 py-2 bg-destructive rounded border border-destructive/50">{error}</p>
                    )}
                    <div className="mt-6">
                        <DialogTitle className="text-lg font-medium text-popover-foreground">Dataset SPSS (.sav)</DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-muted-foreground mb-4">
                            Pilih salah satu dataset contoh untuk memulai analisis.
                        </DialogDescription>
                        {renderFileList(exampleFiles.sav)}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 