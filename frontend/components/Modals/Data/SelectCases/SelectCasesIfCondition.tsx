"use client";

import React, { FC, useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
} from "lucide-react";

interface SelectCasesIfConditionProps {
    variables: Variable[];
    onClose: () => void;
    onContinue: (condition: string) => void;
}

const SelectCasesIfCondition: FC<SelectCasesIfConditionProps> = ({
                                                                     variables,
                                                                     onClose,
                                                                     onContinue
                                                                 }) => {
    const [condition, setCondition] = useState<string>("");
    const [selectedFunctionGroup, setSelectedFunctionGroup] = useState<string>("All");

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableClick = (variable: Variable) => {
        setCondition(prev => prev + ` ${variable.name}`);
    };

    const handleOperatorClick = (operator: string) => {
        setCondition(prev => prev + ` ${operator}`);
    };

    const handleDelete = () => {
        setCondition("");
    };

    const functionGroups = [
        "All",
        "Arithmetic",
        "CDF & Noncentral CDF",
        "Conversion",
        "Current Date/Time",
        "Date Arithmetic",
        "Date Creation"
    ];

    return (
        <DialogContent className="max-w-[800px] p-4">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle className="text-[18px] font-semibold">Select Cases: If</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="grid grid-cols-12 gap-3 py-2">
                {/* Left Column - Variables List */}
                <div className="col-span-3">
                    <Label className="text-[12px] font-medium block mb-1">Variables:</Label>
                    <div className="border border-[#CCCCCC] rounded-md h-[400px] overflow-y-auto">
                        <div className="p-1 space-y-0.5">
                            {variables.map((variable) => (
                                <TooltipProvider key={variable.columnIndex}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex items-center p-1 cursor-pointer border border-[#E6E6E6] rounded hover:bg-[#F7F7F7]"
                                                onClick={() => handleVariableClick(variable)}
                                            >
                                                <div className="flex items-center w-full">
                                                    {getVariableIcon(variable)}
                                                    <span className="text-[12px] truncate">{getDisplayName(variable)}</span>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p className="text-[12px]">{getDisplayName(variable)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Middle Column - Expression Builder */}
                <div className="col-span-5">
                    {/* Expression Input */}
                    <div className="mb-2">
                        <Label className="text-[12px] font-medium block mb-1">Expression:</Label>
                        <div
                            className="h-16 p-2 bg-[#F7F7F7] border border-[#CCCCCC] rounded-md text-[14px] overflow-auto"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => setCondition(e.currentTarget.textContent || "")}
                        >
                            {condition}
                        </div>
                    </div>

                    {/* Calculator Buttons */}
                    <div className="grid grid-cols-6 gap-1">
                        {[
                            { label: "+", value: "+" }, { label: "<", value: "<" }, { label: ">", value: ">" },
                            { label: "7", value: "7" }, { label: "8", value: "8" }, { label: "9", value: "9" },
                            { label: "-", value: "-" }, { label: "<=", value: "<=" }, { label: ">=", value: ">=" },
                            { label: "4", value: "4" }, { label: "5", value: "5" }, { label: "6", value: "6" },
                            { label: "*", value: "*" }, { label: "=", value: "=" }, { label: "~=", value: "~=" },
                            { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" },
                            { label: "/", value: "/" }, { label: "&", value: "&" }, { label: "|", value: "|" }
                        ].map((btn, idx) => (
                            <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="h-8 bg-[#F7F7F7] hover:bg-[#E6E6E6] text-black border-[#CCCCCC] text-[14px]"
                                onClick={() => handleOperatorClick(btn.value)}
                            >
                                {btn.label}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 col-span-2 bg-[#F7F7F7] hover:bg-[#E6E6E6] text-black border-[#CCCCCC] text-[14px]"
                            onClick={() => handleOperatorClick("0")}
                        >
                            0
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-[#F7F7F7] hover:bg-[#E6E6E6] text-black border-[#CCCCCC] text-[14px]"
                            onClick={() => handleOperatorClick(".")}
                        >
                            .
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-[#F7F7F7] hover:bg-[#E6E6E6] text-black border-[#CCCCCC] text-[14px]"
                            onClick={() => handleOperatorClick("**")}
                        >
                            **
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-[#F7F7F7] hover:bg-[#E6E6E6] text-black border-[#CCCCCC] text-[14px]"
                            onClick={() => handleOperatorClick("~")}
                        >
                            ~
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 col-span-4 bg-[#F7F7F7] hover:bg-[#E6E6E6] text-black border-[#CCCCCC] text-[14px]"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>

                    {/* Expression Display Area */}
                    <div className="border border-[#CCCCCC] rounded-md p-2 bg-white h-[160px] mt-3 overflow-auto">
                        <pre className="text-[12px] whitespace-pre-wrap">{condition}</pre>
                    </div>
                </div>

                {/* Right Column - Function Groups */}
                <div className="col-span-4">
                    <div className="mb-2">
                        <Label className="text-[12px] font-medium block mb-1">Function group:</Label>
                        <Select
                            value={selectedFunctionGroup}
                            onValueChange={setSelectedFunctionGroup}
                        >
                            <SelectTrigger className="h-8 text-[12px] border-[#CCCCCC]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {functionGroups.map((group) => (
                                    <SelectItem key={group} value={group} className="text-[12px]">
                                        {group}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-[12px] font-medium block mb-1">Functions:</Label>
                        <div className="border border-[#CCCCCC] rounded-md h-[324px] p-2 bg-white overflow-y-auto">
                            {selectedFunctionGroup === "All" && (
                                <div className="space-y-0.5">
                                    {[
                                        "ABS(numexpr)",
                                        "ANY(logexpr1, logexpr2...)",
                                        "ARSIN(numexpr)",
                                        "ARTAN(numexpr)",
                                        "CDF.BERNOULLI(q,p)",
                                        "CDF.BETA(q,shape1,shape2)",
                                        "CDF.BINOM(q,n,p)",
                                        "CDF.CAUCHY(q,loc,scale)",
                                        "CDF.CHISQ(q,df)",
                                        "CDF.EXP(q,scale)",
                                        "DATE.DMY(day,month,year)",
                                        "DATE.MDY(month,day,year)",
                                        "DATE.MOYR(month,year)",
                                        "DATE.QYR(quarter,year)",
                                        "DATE.WKYR(week,year)",
                                        "DATE.YRDAY(year,day)",
                                        "MAX(val1,val2...)",
                                        "MIN(val1,val2...)",
                                        "MOD(dividend,divisor)",
                                        "NORMAL(mean,stddev)",
                                        "RND(numexpr)",
                                        "SQRT(numexpr)",
                                        "TRUNC(numexpr)"
                                    ].map((func, idx) => (
                                        <div
                                            key={idx}
                                            className="text-[12px] p-1 cursor-pointer hover:bg-[#F7F7F7] border-b border-[#F7F7F7]"
                                            onClick={() => handleOperatorClick(func)}
                                        >
                                            {func}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2 mt-2 p-0">
                <Button
                    variant="default"
                    size="sm"
                    className="bg-black hover:bg-gray-800 text-white h-8 text-[14px]"
                    onClick={() => onContinue(condition)}
                >
                    Continue
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-[#CCCCCC] hover:bg-[#E6E6E6] text-black h-8 text-[14px]"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-[#CCCCCC] hover:bg-[#E6E6E6] text-black h-8 text-[14px]"
                    onClick={() => console.log("Help requested")}
                >
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesIfCondition;