import { useState } from "react";

export function optionHook(
) {

    const [arOrder, setArOrder] = useState<number>(0);
    const [diffOrder, setDiffOrder] = useState<number>(0);
    const [maOrder, setMaOrder] = useState<number>(0);

    function handleArOrder(value: number) {
        setArOrder(value);
    }

    function handleDiffOrder(value: number) {
        setDiffOrder(value);
    }

    function handleMaOrder(value: number) {
        setMaOrder(value);
    }

    function resetOptions() {
        setArOrder(0);
        setDiffOrder(0);
        setMaOrder(0);
    }

    return {
        arOrder,
        diffOrder,
        maOrder,
        handleArOrder,
        handleDiffOrder,
        handleMaOrder,
        resetOptions,
    };
}
