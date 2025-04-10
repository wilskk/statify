// utils/indexedDB.ts
type AnalysisType =
    // Basic & Advanced Analysis
    | "Univariate"
    | "Multivariate"
    | "RepeatedMeasures"
    | "VarianceComponents"
    // Dimension Reduction & Factor Analysis
    | "Factor"
    | "CorrespondenceAnalysis"
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
    | "ROCAnalysis";

const DB_NAME = "AnalysisDB";
const DB_VERSION = 1;

// Convert PascalCase to camelCase for internal store naming
const toCamelCase = (str: string): string => {
    return str.charAt(0).toLowerCase() + str.slice(1);
};

// Initialize the database with all stores
export const initializeDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = request.result;

            // Create stores for all analysis types
            const analysisTypes: AnalysisType[] = [
                // Basic & Advanced Analysis
                "Univariate",
                "Multivariate",
                "RepeatedMeasures",
                "VarianceComponents",
                // Dimension Reduction & Factor Analysis
                "Factor",
                "CorrespondenceAnalysis",
                "CAPTCA",
                "MCA",
                "OVERALS",
                // Clustering & Classification
                "TwoStepCluster",
                "KMeansCluster",
                "HierarchicalCluster",
                "ClusterSilhouettes",
                // Predictive Models & Evaluation
                "Tree",
                "Discriminant",
                "NearestNeighbor",
                "ROCCurve",
                "ROCAnalysis",
            ];

            analysisTypes.forEach((type) => {
                const storeName = toCamelCase(type);
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "id" });
                }
            });
        };
    });
};

// Simplified methods that don't require specifying DB_NAME and STORE_NAME
export const saveFormData = async (
    analysisType: AnalysisType,
    data: any,
    id: string = "formData"
): Promise<void> => {
    const db = await initializeDatabase();
    const storeName = toCamelCase(analysisType);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put({
            id,
            ...data,
            updatedAt: new Date().toISOString(),
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
    });
};

export const getFormData = async (
    analysisType: AnalysisType,
    id: string = "formData"
): Promise<any | null> => {
    const db = await initializeDatabase();
    const storeName = toCamelCase(analysisType);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
        transaction.oncomplete = () => db.close();
    });
};

export const clearFormData = async (
    analysisType: AnalysisType,
    id: string = "formData"
): Promise<void> => {
    const db = await initializeDatabase();
    const storeName = toCamelCase(analysisType);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
    });
};

// Get all saved data for a specific analysis type
export const getAllFormData = async (
    analysisType: AnalysisType
): Promise<any[]> => {
    const db = await initializeDatabase();
    const storeName = toCamelCase(analysisType);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
        transaction.oncomplete = () => db.close();
    });
};
