import { useState, useEffect } from "react";
import type { Variable } from "@/types/Variable";

export const useOptionHook = () => {
    const [pOrder, setPOrder] = useState<number>(1); // AR order for Y
    const [qOrders, setQOrders] = useState<number[]>([1]); // DL orders for each X variable

    const handlePOrder = (value: number) => {
        setPOrder(value);
    };

    const handleQOrders = (value: number[]) => {
        setQOrders(value);
    };

    const resetOptions = () => {
        setPOrder(1);
        setQOrders([1]);
    };

    return {
        pOrder,
        qOrders,
        handlePOrder,
        handleQOrders,
        resetOptions,
    };
};
