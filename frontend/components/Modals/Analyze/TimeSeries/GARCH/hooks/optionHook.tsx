import { useState } from "react";

export const useOptionHook = () => {
    const [pOrder, setPOrder] = useState<number>(1); // GARCH order (default 1)
    const [qOrder, setQOrder] = useState<number>(1); // ARCH order (default 1)
    const [modelType, setModelType] = useState<string>("GARCH"); // GARCH, EGARCH, TGARCH

    const handlePOrder = (value: number) => {
        setPOrder(value);
    };

    const handleQOrder = (value: number) => {
        setQOrder(value);
    };

    const handleModelType = (value: string) => {
        setModelType(value);
    };

    const resetOptions = () => {
        setPOrder(1);
        setQOrder(1);
        setModelType("GARCH");
    };

    return {
        pOrder,
        qOrder,
        modelType,
        handlePOrder,
        handleQOrder,
        handleModelType,
        resetOptions,
    };
};
