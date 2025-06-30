export interface UseExampleDatasetLogicProps {
    onClose: () => void;
}

export interface UseExampleDatasetLogicOutput {
    isLoading: boolean;
    error: string | null;
    loadDataset: (filePath: string) => Promise<void>;
} 