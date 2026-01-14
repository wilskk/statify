import { useState } from "react";

export const useOptionHook = () => {
    const [qOrder, setQOrder] = useState<number>(1); // ARCH order (default 1)

    const handleQOrder = (value: number) => {
        setQOrder(value);
    };

    const resetOptions = () => {
        setQOrder(1);
    };

    return {
        qOrder,
        handleQOrder,
        resetOptions,
    };
};
