type AnalysisType =
    // Basic & Advanced Analysis
    | "Univariate"
    | "Multivariate"
    | "RepeatedMeasuresDefine"
    | "RepeatedMeasures"
    | "VarianceComponents"
    // Dimension Reduction & Factor Analysis
    | "Factor"
    | "CorrespondenceAnalysis"
    | "OptimalScaling"
    | "CAPTCA"
    | "MCA"
    | "OVERALS"
    // Clustering & Classification
    | "TwoStepCluster"
    | "KMeansCluster"
    | "HierarchicalCluster"
    | "ClusterSilhouettes"
    // Predictive Models & Evaluation
    | "Tree"
    | "Discriminant"
    | "NearestNeighbor"
    | "ROCCurve"
    | "ROCAnalysis"
    // Time Series
    | "TimeSeriesTime"
    | "Smoothing"
    | "Decomposition"
    | "AutoCorrelation"
    | "UnitRootTest"
    | "BoxJenkinsModel"
    ;

const DB_NAME = "Statify";
const STORE_NAME = "AnalysisForm";
const DB_VERSION = 35;

// Generate a consistent ID for each analysis type
const generateFormId = (
    analysisType: AnalysisType,
    suffix: string = "formData"
): string => {
    return `${analysisType}_${suffix}`;
};

// Initialize the database with a single store
export const initializeDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = request.result;

            // Create a single store for all analysis forms
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
    });
};

// Save form data for a specific analysis type
export const saveFormData = async (
    analysisType: AnalysisType,
    data: any,
    suffix: string = "formData"
): Promise<void> => {
    const db = await initializeDatabase();
    const formId = generateFormId(analysisType, suffix);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({
            id: formId,
            analysisType,
            ...data,
            updatedAt: new Date().toISOString(),
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
    });
};

// Get form data for a specific analysis type
export const getFormData = async (
    analysisType: AnalysisType,
    suffix: string = "formData"
): Promise<any | null> => {
    const db = await initializeDatabase();
    const formId = generateFormId(analysisType, suffix);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(formId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
        transaction.oncomplete = () => db.close();
    });
};

// Clear form data for a specific analysis type
export const clearFormData = async (
    analysisType: AnalysisType,
    suffix: string = "formData"
): Promise<void> => {
    const db = await initializeDatabase();
    const formId = generateFormId(analysisType, suffix);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(formId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
    });
};

// Get all saved forms for a specific analysis type
export const getAllAnalysisData = async (
    analysisType: AnalysisType
): Promise<any[]> => {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            // Filter results to match the requested analysis type
            const allData = request.result || [];
            const filteredData = allData.filter(
                (item) => item.analysisType === analysisType
            );
            resolve(filteredData);
        };
        transaction.oncomplete = () => db.close();
    });
};

// Get all form data in the store
export const getAllFormData = async (): Promise<any[]> => {
    const db = await initializeDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
        transaction.oncomplete = () => db.close();
    });
};
