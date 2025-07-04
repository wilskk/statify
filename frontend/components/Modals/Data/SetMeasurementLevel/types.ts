import { Variable } from "@/types/Variable";
import { useSetMeasurementLevel } from "./hooks/useSetMeasurementLevel";

export interface SetMeasurementLevelProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export type SetMeasurementLevelUIProps = ReturnType<typeof useSetMeasurementLevel> & {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}; 