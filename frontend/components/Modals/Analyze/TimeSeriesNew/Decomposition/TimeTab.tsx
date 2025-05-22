import React, { FC } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

interface TimeTabProps{
    periods: PeriodOption[],
    selectedPeriod: [string, string],
    initialType: string,
    handleSelectedPeriod: (id: string) => void,
    inputPeriods: (period: string) => React.ReactNode
}

const TimeTab: FC<TimeTabProps> = ({
    periods,
    selectedPeriod,
    initialType,
    handleSelectedPeriod,
    inputPeriods,
})  => {
    return(
        <div className="flex flex-row gap-4">
            <div className="border-2 rounded-md w-[350px] h-full pb-4">
                <div className="mt-4 ml-4">
                        <label className="font-semibold">Time Option</label>
                </div>
                <div className="flex items-center p-4">
                    <div className="flex flex-row w-full">
                        <div className="flex items-center">
                            <label className="w-[150px] text-sm font-semibold">
                                time spesification :
                            </label>
                        </div>
                        <Select 
                            onValueChange={handleSelectedPeriod} 
                            defaultValue={selectedPeriod[1]}
                        >
                            <SelectTrigger className="">
                                <SelectValue>{selectedPeriod[1]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map((period) => (
                                    <SelectItem key={period.id} value={period.id}>
                                        {period.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center ml-4">
                    <label className="w-full text-sm font-semibold">
                        periodicity : {selectedPeriod[0] === '0' ? "don't have periodicity" : selectedPeriod[0]}
                    </label>
                </div>
                <div className="flex flex-col ml-4 mt-5">
                    {inputPeriods(initialType)}
                </div>
            </div>
        </div>
    )
};

export default TimeTab;