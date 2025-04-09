// src/components/tabs/OptionsTab.tsx
import React, { FC } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Interface OptionsTabProps (tidak berubah)
interface OptionsTabProps {
    testDistribution: string;
    setTestDistribution: React.Dispatch<React.SetStateAction<string>>;
    degreesOfFreedom: string;
    setDegreesOfFreedom: React.Dispatch<React.SetStateAction<string>>;
    estimateFromData: boolean;
    setEstimateFromData: React.Dispatch<React.SetStateAction<boolean>>;
    location: string;
    setLocation: React.Dispatch<React.SetStateAction<string>>;
    scale: string;
    setScale: React.Dispatch<React.SetStateAction<string>>;
    naturalLogTransform: boolean;
    setNaturalLogTransform: React.Dispatch<React.SetStateAction<boolean>>;
    standardizeValues: boolean;
    setStandardizeValues: React.Dispatch<React.SetStateAction<boolean>>;
    difference: boolean;
    setDifference: React.Dispatch<React.SetStateAction<boolean>>;
    differenceValue: string;
    setDifferenceValue: React.Dispatch<React.SetStateAction<string>>;
    seasonallyDifference: boolean;
    setSeasonallyDifference: React.Dispatch<React.SetStateAction<boolean>>;
    seasonallyDifferenceValue: string;
    setSeasonallyDifferenceValue: React.Dispatch<React.SetStateAction<string>>;
    currentPeriodicity: string;
    proportionEstimation: string;
    setProportionEstimation: React.Dispatch<React.SetStateAction<string>>;
    rankAssignedToTies: string;
    setRankAssignedToTies: React.Dispatch<React.SetStateAction<string>>;
}


const OptionsTab: FC<OptionsTabProps> = ({
                                             testDistribution,
                                             setTestDistribution,
                                             degreesOfFreedom,
                                             setDegreesOfFreedom,
                                             estimateFromData,
                                             setEstimateFromData,
                                             location,
                                             setLocation,
                                             scale,
                                             setScale,
                                             naturalLogTransform,
                                             setNaturalLogTransform,
                                             standardizeValues,
                                             setStandardizeValues,
                                             difference,
                                             setDifference,
                                             differenceValue,
                                             setDifferenceValue,
                                             seasonallyDifference,
                                             setSeasonallyDifference,
                                             seasonallyDifferenceValue,
                                             setSeasonallyDifferenceValue,
                                             currentPeriodicity,
                                             proportionEstimation,
                                             setProportionEstimation,
                                             rankAssignedToTies,
                                             setRankAssignedToTies
                                         }) => {
    // Menyederhanakan pengecekan disabled
    const distributionNeedsDf = ["t", "Chi-square", "F"];

    return (
        // Menggunakan grid: 1 kolom di layar kecil, 2 kolom di layar medium ke atas
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">

            {/* === Kolom 1 === */}
            <div className="flex flex-col">
                {/* Distribution Section Card */}
                <div className="flex-1 rounded-md border border-[#E6E6E6] p-6">
                    {/* Test Distribution Sub-section */}
                    <div>
                        <div className="mb-4 text-sm font-medium">Test Distribution</div>
                        <div className="space-y-5"> {/* Menambah jarak vertikal */}
                            <Select
                                value={testDistribution}
                                onValueChange={setTestDistribution}
                            >
                                <SelectTrigger className="h-9 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"> {/* Konsistensi tinggi */}
                                    <SelectValue placeholder="Select a distribution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Uniform">Uniform</SelectItem>
                                    <SelectItem value="Exponential">Exponential</SelectItem>
                                    <SelectItem value="t">Student's t</SelectItem>
                                    <SelectItem value="Chi-square">Chi-square</SelectItem>
                                    <SelectItem value="F">F</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="degreesOfFreedom" className="w-20 flex-shrink-0 text-sm">
                                    df:
                                </Label>
                                <Input
                                    id="degreesOfFreedom"
                                    value={degreesOfFreedom}
                                    onChange={(e) => setDegreesOfFreedom(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={!distributionNeedsDf.includes(testDistribution)} // Logika disederhanakan
                                />
                            </div>
                        </div>
                    </div>

                    {/* Distribution Parameters Sub-section */}
                    {/* Menggabungkan title ke dalam div ini */}
                    <div className="mt-6 border-t border-[#E6E6E6] pt-4">
                        <div className="mb-4 text-sm font-medium">Distribution Parameters</div>
                        <div className="space-y-5"> {/* Menambah jarak vertikal */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="estimateFromData"
                                    checked={estimateFromData}
                                    onCheckedChange={(checked) => setEstimateFromData(!!checked)}
                                    className="border-[#CCCCCC]"
                                />
                                <Label htmlFor="estimateFromData" className="cursor-pointer text-sm">
                                    Estimate from data
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="location" className="w-20 flex-shrink-0 text-sm"> {/* Tambah htmlFor */}
                                    Location:
                                </Label>
                                <Input
                                    id="location" // Tambah id
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={estimateFromData}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="scale" className="w-20 flex-shrink-0 text-sm"> {/* Tambah htmlFor */}
                                    Scale:
                                </Label>
                                <Input
                                    id="scale" // Tambah id
                                    value={scale}
                                    onChange={(e) => setScale(e.target.value)}
                                    className="h-9 flex-1 border-[#CCCCCC] text-sm focus:border-black focus:ring-black"
                                    disabled={estimateFromData}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === Kolom 2 === */}
            {/* Menggunakan space-y-6 untuk jarak antar kartu di kolom ini */}
            <div className="flex flex-col space-y-6">

                {/* Transform Section Card */}
                <div className="flex-1 rounded-md border border-[#E6E6E6] p-6">
                    <div className="mb-4 text-sm font-medium">Transform</div>
                    <div className="space-y-5"> {/* Menambah jarak vertikal */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="naturalLogTransform"
                                checked={naturalLogTransform}
                                onCheckedChange={(checked) => setNaturalLogTransform(!!checked)}
                                className="border-[#CCCCCC]"
                            />
                            <Label htmlFor="naturalLogTransform" className="cursor-pointer text-sm">
                                Natural log transform
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="standardizeValues"
                                checked={standardizeValues}
                                onCheckedChange={(checked) => setStandardizeValues(!!checked)}
                                className="border-[#CCCCCC]"
                            />
                            <Label htmlFor="standardizeValues" className="cursor-pointer text-sm">
                                Standardize values
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="difference"
                                checked={difference}
                                onCheckedChange={(checked) => setDifference(!!checked)}
                                className="border-[#CCCCCC] flex-shrink-0"
                            />
                            {/* Membiarkan label wrap */}
                            <Label htmlFor="difference" className="cursor-pointer text-sm">
                                Difference:
                            </Label>
                            <Input
                                id="differenceValue" // Tambah ID
                                value={differenceValue}
                                onChange={(e) => setDifferenceValue(e.target.value)}
                                className="ml-auto h-9 w-16 flex-shrink-0 border-[#CCCCCC] text-sm focus:border-black focus:ring-black" // ml-auto, w-16, h-9
                                disabled={!difference}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="seasonallyDifference"
                                checked={seasonallyDifference}
                                onCheckedChange={(checked) => setSeasonallyDifference(!!checked)}
                                className="border-[#CCCCCC] flex-shrink-0"
                                disabled={true}
                            />
                            {/* Membiarkan label wrap */}
                            <Label htmlFor="seasonallyDifference" className="cursor-pointer text-sm text-gray-400">
                                Seasonally difference:
                            </Label>
                            <Input
                                id="seasonallyDifferenceValue" // Tambah ID
                                value={seasonallyDifferenceValue}
                                onChange={(e) => setSeasonallyDifferenceValue(e.target.value)}
                                className="ml-auto h-9 w-16 flex-shrink-0 border-[#CCCCCC] bg-gray-100 text-sm focus:border-black focus:ring-black" // ml-auto, w-16, h-9
                                disabled={true}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-1"> {/* Sedikit padding top */}
                            {/* Hapus mr-2 dari Label */}
                            <Label className="text-sm">
                                Current Periodicity:
                            </Label>
                            <span className="text-sm">{currentPeriodicity || 'None'}</span> {/* Menampilkan 'None' jika kosong */}
                        </div>
                    </div>
                </div>

                {/* Estimation Section (Container untuk 2 kartu estimasi) */}
                {/* Tidak perlu grid lagi di sini karena sudah ditumpuk oleh space-y-6 dari parent */}
                {/* Card: Proportion Estimation Formula */}
                <div className="rounded-md border border-[#E6E6E6] p-6">
                    <div className="mb-4 text-sm font-medium">Proportion Estimation Formula</div>
                    <RadioGroup
                        value={proportionEstimation}
                        onValueChange={setProportionEstimation}
                        className="space-y-3" // Jarak antar baris flex
                    >
                        {/* Baris 1 Radio */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"> {/* Menggunakan gap dan flex-wrap */}
                            <div className="flex items-center space-x-2"> {/* space-x untuk item dan label */}
                                <RadioGroupItem
                                    value="Blom's"
                                    id="bloms"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                {/* Tulis apostrophe langsung */}
                                <Label htmlFor="bloms" className="cursor-pointer text-sm">
                                    Blom's
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Rankit"
                                    id="rankit"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="rankit" className="cursor-pointer text-sm">
                                    Rankit
                                </Label>
                            </div>
                        </div>
                        {/* Baris 2 Radio */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Tukey's"
                                    id="tukeys"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="tukeys" className="cursor-pointer text-sm">
                                    Tukey's
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Van der Waerden's"
                                    id="vanderwaerdens"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="vanderwaerdens" className="cursor-pointer text-sm">
                                    Van der Waerden's
                                </Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                {/* Card: Rank Assigned to Ties */}
                <div className="rounded-md border border-[#E6E6E6] p-6">
                    <div className="mb-4 text-sm font-medium">Rank Assigned to Ties</div>
                    <RadioGroup
                        value={rankAssignedToTies}
                        onValueChange={setRankAssignedToTies}
                        className="space-y-3" // Jarak antar baris flex
                    >
                        {/* Baris 1 Radio */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Mean"
                                    id="mean"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="mean" className="cursor-pointer text-sm">
                                    Mean
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="High"
                                    id="high"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="high" className="cursor-pointer text-sm">
                                    High
                                </Label>
                            </div>
                        </div>
                        {/* Baris 2 Radio */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Low"
                                    id="low"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="low" className="cursor-pointer text-sm">
                                    Low
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="Break ties arbitrarily"
                                    id="breaktiesarbitrarily"
                                    className="border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="breaktiesarbitrarily" className="cursor-pointer text-sm">
                                    Break ties arbitrarily
                                </Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

            </div> {/* Akhir Kolom 2 */}
        </div> // Akhir Grid Utama
    );
};

export default OptionsTab;