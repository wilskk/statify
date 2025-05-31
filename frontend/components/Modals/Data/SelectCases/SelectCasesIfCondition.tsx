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
    initialExpression?: string;
}

const SelectCasesIfCondition: FC<SelectCasesIfConditionProps> = ({
                                                                     variables,
                                                                     onClose,
                                                                     onContinue,
                                                                     initialExpression
                                                                 }) => {
    const [condition, setCondition] = useState<string>(initialExpression || "");
    const [selectedFunctionGroup, setSelectedFunctionGroup] = useState<string>("All");

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
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
        <DialogContent className="max-w-[800px] p-4 bg-popover border border-border">
            <DialogHeader className="p-0 mb-2">
                <DialogTitle className="text-[18px] font-semibold text-popover-foreground">Select Cases: If</DialogTitle>
            </DialogHeader>
            <Separator className="my-0" />

            <div className="grid grid-cols-12 gap-3 py-2">
                {/* Left Column - Variables List */}
                <div className="col-span-3">
                    <Label className="text-[12px] font-medium block mb-1 text-popover-foreground">Variables:</Label>
                    <div className="border border-border rounded-md h-[400px] overflow-y-auto bg-card">
                        <div className="p-1 space-y-0.5">
                            {variables.map((variable) => (
                                <TooltipProvider key={variable.columnIndex}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex items-center p-1 cursor-pointer border border-border rounded hover:bg-accent text-card-foreground"
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
                        <Label className="text-[12px] font-medium block mb-1 text-popover-foreground">Expression:</Label>
                        <div
                            className="h-16 p-2 bg-input border border-input rounded-md text-[14px] overflow-auto text-foreground focus-within:ring-1 focus-within:ring-ring"
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
                                className="h-8 text-[14px]"
                                onClick={() => handleOperatorClick(btn.value)}
                            >
                                {btn.label}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 col-span-2 text-[14px]"
                            onClick={() => handleOperatorClick("0")}
                        >
                            0
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[14px]"
                            onClick={() => handleOperatorClick(".")}
                        >
                            .
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[14px]"
                            onClick={() => handleOperatorClick("**")}
                        >
                            **
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[14px]"
                            onClick={() => handleOperatorClick("~")}
                        >
                            ~
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 col-span-4 text-[14px]"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>

                    {/* Expression Display Area */}
                    <div className="border border-border rounded-md p-2 bg-background h-[160px] mt-3 overflow-auto">
                        <pre className="text-[12px] whitespace-pre-wrap text-foreground">{condition}</pre>
                    </div>
                </div>

                {/* Right Column - Function Groups */}
                <div className="col-span-4">
                    <div className="mb-2">
                        <Label className="text-[12px] font-medium block mb-1 text-popover-foreground">Function group:</Label>
                        <Select
                            value={selectedFunctionGroup}
                            onValueChange={setSelectedFunctionGroup}
                        >
                            <SelectTrigger className="h-8 text-[12px]">
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
                        <Label className="text-[12px] font-medium block mb-1 text-popover-foreground">Functions:</Label>
                        <div className="border border-border rounded-md h-[324px] p-2 bg-card overflow-y-auto text-card-foreground">
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
                                        "STRING(numexpr, format)",
                                        "SUBSTR(strexpr,pos,len)",
                                        "SUM(val1,val2...)",
                                        "TRUNC(numexpr)",
                                        "UNIFORM(max)",
                                        "UPCASE(strexpr)",
                                        "XDATE.DATE(datestring,format)",
                                        // ... tambahkan fungsi lain jika perlu
                                    ].map(func => <div key={func} className="p-0.5 hover:bg-accent rounded-sm cursor-pointer text-xs">{func}</div>)}
                                </div>
                            )}
                            {/* Tambahkan logika untuk grup fungsi lain jika diperlukan */}
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="pt-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => onContinue(condition)}>Continue</Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesIfCondition;