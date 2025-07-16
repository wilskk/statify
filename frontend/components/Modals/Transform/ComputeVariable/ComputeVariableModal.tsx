import React, { useState } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore, CellUpdate } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Variable } from "@/types/Variable";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ComputeVariableProps {
  onClose: () => void;
  containerType?: "dialog" | "sidebar";
}

const ComputeVariableModal: React.FC<ComputeVariableProps> = ({
  onClose,
  containerType = "dialog",
}) => {
  const [targetVariable, setTargetVariable] = useState("");
  const [numericExpression, setNumericExpression] = useState("");
  const [selectedVariable, setSelectedVariable] = useState("");
  const [functionGroup, setFunctionGroup] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");
  const [showTypeLabelModal, setShowTypeLabelModal] = useState(false);
  const [additionalInput, setAdditionalInput] = useState("");
  const { addLog, addAnalytic, addStatistic } = useResultStore();

  // Use the correct type from Variable definition
  const [variableType, setVariableType] = useState<Variable["type"]>("NUMERIC");
  const [variableLabel, setVariableLabel] = useState("");

  const variables = useVariableStore((state) => state.variables);
  const addVariable = useVariableStore((state) => state.addVariable);
  const data = useDataStore((state) => state.data);
  const setData = useDataStore((state) => state.setData);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Function to parse round parameters
  const parseRoundDecimals = (expression: string): number | null => {
    const roundRegex = /round\s*\(\s*[^,]+,\s*(\d+)\s*\)/i;
    const match = expression.match(roundRegex);
    return match ? parseInt(match[1]) : null;
  };

  // Function to check if expression contains log1p
  const hasLog1p = (expression: string): boolean => {
    return /log1p\s*\(/i.test(expression);
  };

  // Function to preprocess expression
  function preprocessExpression(expression: string): string {
    return expression.replace(/~\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, "not($1)");
  }

  // Function to clean data
  function cleanData(rawData: any[][]) {
    return rawData.filter(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => cell !== null && cell !== undefined && cell !== "")
    );
  }

  const handleAddToExpression = (value: string) => {
    setNumericExpression((prev) => prev + value);
  };

  const handleCompute = async () => {
    if (!targetVariable || !numericExpression) {
      alert("Target Variable dan Numeric Expression wajib diisi.");
      return;
    }

    const variableExists = variables.find((v) => v.name === targetVariable);
    if (variableExists) {
      alert("Nama variabel target sudah ada. Silakan pilih nama lain.");
      return;
    }

    const variableNames = variables.map((v) => v.name);
    const regex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    const exprVariables = numericExpression.match(regex) || [];

    // Extended list of allowed functions
    const allowedFunctions = [
      // Basic arithmetic and mathematical
      "min",
      "max",
      "mean",
      "stddev",
      "abs",
      "sqrt",
      "not",
      "median",
      "mode",
      "mod",
      "std",
      "cbrt",
      "exp",
      "cube",
      "log",
      "ln",
      "log10",
      "log2",
      "log1p",
      "square",
      "divide",
      "add",
      "subtract",
      "pow",
      "round",
      "fix",
      "multiply",
      "factorial",
      "combinations",
      "permutations",
      "gamma",
      "erf",
      "nthRoot",
      "sign",

      // Trigonometric functions
      "sin",
      "cos",
      "tan",
      "arcos",
      "arsin",
      "artan",
      "atan",
      "sinh",
      "cosh",
      "tanh",
      "sec",
      "csc",
      "cot",

      // Statistical functions
      "corr",
      "trunc",
      "sum",
      "uncorrected",
      "biased",
      "var_p",
      "var_s",
      "std_p",
      "std_s",
      "cov",
      "colmean",
      "colsum",
      "colmedian",
      "colmin",
      "colmax",
      "colvar_p",
      "colvar_s",
      "colstd_p",
      "colstd_s",
      "prod",
      "quantileSeq",
      "mad",

      // Matrix operations
      "transpose",
      "det",
      "inv",
      "trace",
      "diag",
      "dot",
      "cross",

      // Special and utility functions
      "random_uniform",
      "gcd",
      "lcm",
    ];

    const missingVars = exprVariables.filter(
      (varName) =>
        varName && // Pastikan varName tidak null atau undefined
        !variableNames.includes(varName) &&
        !(
          typeof varName === "string" &&
          allowedFunctions.includes(varName.toLowerCase())
        )
    );

    if (missingVars.length > 0) {
      alert(`Variabel berikut tidak ditemukan: ${missingVars.join(", ")}`);
      return;
    }

    setIsCalculating(true); // Set state isCalculating ke true saat proses dimulai

    try {
      // Inisialisasi worker
      const worker = new Worker("/workers/ComputeVariable/ComputeVariable.js");

      const cleanedData = cleanData(data);

      // Parse round decimals if present
      const roundDecimals = parseRoundDecimals(numericExpression);

      worker.postMessage({
        data: cleanedData,
        variables,
        numericExpression,
        variableType,
      });

      worker.onmessage = async (event) => {
        const { success, computedValues, tableData, error } = event.data;

        if (success) {
          try {
            // Tambahkan nilai baru ke baris data di thread utama
            const newData = data.map((row, rowIndex) => {
              const updatedRow = [...row];
              const newColumnIndex = variables.length;

              // Tambahkan kolom baru jika perlu
              if (updatedRow.length <= newColumnIndex) {
                while (updatedRow.length <= newColumnIndex) {
                  updatedRow.push("");
                }
              }

              // Assign nilai hasil komputasi
              updatedRow[newColumnIndex] = computedValues[rowIndex];

              return updatedRow;
            });

            // Create a partial Variable object based on the Variable type
            const newVariable: Partial<Variable> = {
              columnIndex: variables.length,
              name: targetVariable,
              type: variableType,
              width: 8,
              decimals:
                roundDecimals !== null
                  ? roundDecimals
                  : hasLog1p(numericExpression)
                  ? 5
                  : variableType === "NUMERIC"
                  ? 2
                  : 0,
              label: variableLabel,
              values: [],
              missing: null,
              columns: 200,
              align: variableType === "NUMERIC" ? "right" : "left",
              measure: variableType === "NUMERIC" ? "scale" : "nominal",
              role: "input",
            };

            await addVariable(newVariable);

            // Perbarui data di store - collect all updates at once
            const bulkUpdates: CellUpdate[] = [];
            newData.forEach((row, rowIndex) => {
              const newColumnIndex = variables.length;
              const value = row[newColumnIndex];
              // Only add non-null values to the update
              if (value !== null) {
                bulkUpdates.push({
                  row: rowIndex,
                  col: newColumnIndex,
                  value,
                });
              }
            });

            // Apply all updates in one call
            if (bulkUpdates.length > 0) {
              await useDataStore.getState().updateCells(bulkUpdates);
            }

            // Persist changes to backend/file
            await useDataStore.getState().saveData();

            // Tambahkan log dan analytics
            const logMsg = `COMPUTE VARIABLE ${targetVariable} WITH EXPRESSION "${numericExpression}"`;
            const logId = await addLog({ log: logMsg });
            const analyticId = await addAnalytic(logId, {
              title: "Compute Variable",
              note: "",
            });
            await addStatistic(analyticId, {
              title: "Compute Variable",
              output_data: JSON.stringify({
                text: [
                  {
                    text: `The variable \`${targetVariable}\` was successfully added as the last variable in the dataset. `, // \n to enter
                  },
                ],
              }),
              components: "Executed",
              description: "",
            });

            setIsCalculating(false); // Set isCalculating ke false setelah sukses
            onClose(); // Tutup modal
          } catch (err) {
            console.error("Error during post-compute actions:", err);
            setErrorMsg("Terjadi kesalahan saat menyimpan hasil.");
            setIsCalculating(false); // Set isCalculating ke false jika ada error
          }
        } else {
          setErrorMsg(error || "Worker gagal menghitung variabel.");
          setIsCalculating(false); // Set isCalculating ke false jika worker gagal
        }
        worker.terminate(); // Hentikan worker
      };

      worker.onerror = (error) => {
        console.error("Worker error:", error);
        setErrorMsg(
          "Terjadi kesalahan pada worker. Periksa konsol untuk detail."
        );
        setIsCalculating(false); // Set isCalculating ke false jika terjadi error pada worker
        worker.terminate();
      };
    } catch (error) {
      console.error("Error during computation:", error);
      setErrorMsg("Gagal memulai proses perhitungan.");
      setIsCalculating(false); // Set isCalculating ke false jika terjadi error
    }
  };

  // Content of the compute variable modal
  const ModalContent = () => (
    <>
      {errorMsg && (
        <div className="col-span-12 text-red-600 font-medium mb-4">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 py-4">
        {/* Target Variable Input */}
        <div className="col-span-12 flex items-center space-x-2">
          <Label htmlFor="target-variable" className="whitespace-nowrap">
            Target Variable
          </Label>
          <Input
            id="target-variable"
            value={targetVariable}
            onChange={(e) => setTargetVariable(e.target.value)}
            className="flex-grow"
          />
          <Button variant="outline" onClick={() => setShowTypeLabelModal(true)}>
            Type & Label
          </Button>
        </div>

        {/* Variables and Functions Selection */}
        <div className="col-span-4">
          <Label>Variables</Label>
          <Select onValueChange={setSelectedVariable}>
            <SelectTrigger>
              <SelectValue placeholder="Select Variable" />
            </SelectTrigger>
            <SelectContent>
              {variables.map((variable) => (
                <SelectItem key={variable.columnIndex} value={variable.name}>
                  {variable.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => handleAddToExpression(selectedVariable)}
            disabled={!selectedVariable}
          >
            Add Variable to Expression
          </Button>
        </div>

        <div className="col-span-8">
          <Label htmlFor="numeric-expression">Numeric Expression</Label>
          <Textarea
            id="numeric-expression"
            value={numericExpression}
            onChange={(e) => setNumericExpression(e.target.value)}
            rows={4}
          />
        </div>

        <div className="col-span-12">
          <Label>Calculator</Label>
          <div className="grid grid-cols-6 gap-2">
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("+")}
            >
              +
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("<")}
            >
              &lt;
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression(">")}
            >
              &gt;
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("7")}
            >
              7
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("8")}
            >
              8
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("9")}
            >
              9
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAddToExpression("-")}
            >
              -
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("<=")}
            >
              &lt;=
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression(">=")}
            >
              &gt;=
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("4")}
            >
              4
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("5")}
            >
              5
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("6")}
            >
              6
            </Button>

            {/* Third Row */}
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("*")}
            >
              *
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("==")}
            >
              ==
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("!=")}
            >
              ≠
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("1")}
            >
              1
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("2")}
            >
              2
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("3")}
            >
              3
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAddToExpression("/")}
            >
              /
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("&")}
            >
              &
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("|")}
            >
              |
            </Button>
            <Button
              variant="outline"
              className="col-span-2"
              onClick={() => handleAddToExpression("0")}
            >
              0
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression(".")}
            >
              .
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAddToExpression("^")}
            >
              ^
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("not(")}
            >
              ~
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddToExpression("()")}
            >
              ( )
            </Button>
            <Button
              variant="outline"
              className="col-span-3"
              onClick={() => setNumericExpression("")}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="col-span-6">
          <Label>Function Group</Label>
          <Select onValueChange={setFunctionGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Select Function Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arithmetic">Arithmetic</SelectItem>
              <SelectItem value="Statistical">Statistical</SelectItem>
              <SelectItem value="Trigonometry">Trigonometry</SelectItem>
              <SelectItem value="Matrix">Matrix</SelectItem>
              <SelectItem value="Special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-6">
          <Label>Function</Label>
          <Select onValueChange={setSelectedFunction}>
            <SelectTrigger>
              <SelectValue placeholder="Select Function" />
            </SelectTrigger>
            <SelectContent>
              {/* Based on selected function group, list functions */}
              {functionGroup === "Arithmetic" && (
                <>
                  <SelectItem value="abs(">abs(var)</SelectItem>
                  <SelectItem value="sqrt(">sqrt(var)</SelectItem>
                  <SelectItem value="cbrt(">cbrt(var)</SelectItem>
                  <SelectItem value="exp(">exp(var)</SelectItem>
                  <SelectItem value="ln(">ln(var)</SelectItem>
                  <SelectItem value="log(">log(var, basis)</SelectItem>
                  <SelectItem value="log2(">log2(var)</SelectItem>
                  <SelectItem value="log10(">log10(var)</SelectItem>
                  <SelectItem value="log1p(">log1p(var)</SelectItem>
                  <SelectItem value="square(">square(var)</SelectItem>
                  <SelectItem value="cube(">cube(var)</SelectItem>
                  <SelectItem value="mod(">mod(x,y)</SelectItem>
                  <SelectItem value="round(">round(var, number)</SelectItem>
                  <SelectItem value="divide(">divide(var, var)</SelectItem>
                  <SelectItem value="subtract(">subtract(var, var)</SelectItem>
                  <SelectItem value="add(">add(var, var)</SelectItem>
                  <SelectItem value="pow(">pow(var, var)</SelectItem>
                  <SelectItem value="fix(">fix(var)</SelectItem>
                  <SelectItem value="multiply(">multiply(var)</SelectItem>
                  <SelectItem value="gcd(">gcd(var, var)</SelectItem>
                  <SelectItem value="lcm(">lcm(var, var)</SelectItem>
                  <SelectItem value="nthRoot(">nthRoot(var, n)</SelectItem>
                  <SelectItem value="sign(">sign(var)</SelectItem>
                </>
              )}
              {functionGroup === "Statistical" && (
                <>
                  <SelectItem value="mean(">mean(var)</SelectItem>
                  <SelectItem value="median(">median(var)</SelectItem>
                  <SelectItem value="mode(">mode(var)</SelectItem>
                  <SelectItem value="std_p(">std_p(var, var)</SelectItem>
                  <SelectItem value="std_s(">std_s(var, var)</SelectItem>
                  <SelectItem value="var_p(">var_p(var, var)</SelectItem>
                  <SelectItem value="var_s(">var_s(var, var)</SelectItem>
                  <SelectItem value="mad(">mad(var)</SelectItem>
                  <SelectItem value="min(">min(var, var)</SelectItem>
                  <SelectItem value="max(">max(var, var)</SelectItem>
                  <SelectItem value="sum(">sum(var, var)</SelectItem>
                  <SelectItem value="colmean(">colmean(var)</SelectItem>
                  <SelectItem value="colmedian(">colmedian(var)</SelectItem>
                  <SelectItem value="colmin(">colmin(var, var)</SelectItem>
                  <SelectItem value="colmax(">colmax(var, var)</SelectItem>
                  <SelectItem value="colsum(">colsum(var, var)</SelectItem>
                  <SelectItem value="colstd_p(">colstd_p(var, var)</SelectItem>
                  <SelectItem value="colstd_s(">colstd_s(var, var)</SelectItem>
                  <SelectItem value="colvar_p(">colvar_p(var, var)</SelectItem>
                  <SelectItem value="colvar_s(">colvar_s(var, var)</SelectItem>
                  <SelectItem value="prod(">prod(var)</SelectItem>
                  <SelectItem value="quantileSeq(">
                    quantileSeq(var, prob)
                  </SelectItem>
                  <SelectItem value="corr(">corr(var1, var2)</SelectItem>
                </>
              )}
              {functionGroup === "Trigonometry" && (
                <>
                  <SelectItem value="sin(">sin(rad)</SelectItem>
                  <SelectItem value="cos(">cos(rad)</SelectItem>
                  <SelectItem value="tan(">tan(rad)</SelectItem>
                  <SelectItem value="arsin(">arsin(x)</SelectItem>
                  <SelectItem value="artan(">artan(x)</SelectItem>
                  <SelectItem value="arcos(">arcos(x)</SelectItem>
                  <SelectItem value="atan(">atan(var)</SelectItem>
                  <SelectItem value="sinh(">sinh(var)</SelectItem>
                  <SelectItem value="cosh(">cosh(var)</SelectItem>
                  <SelectItem value="tanh(">tanh(var)</SelectItem>
                  <SelectItem value="sec(">sec(var)</SelectItem>
                  <SelectItem value="csc(">csc(var)</SelectItem>
                  <SelectItem value="cot(">cot(var)</SelectItem>
                </>
              )}
              {functionGroup === "Matrix" && (
                <>
                  <SelectItem value="det(">det(matrix)</SelectItem>
                  <SelectItem value="inv(">inv(matrix)</SelectItem>
                  <SelectItem value="transpose(">transpose(matrix)</SelectItem>
                  <SelectItem value="trace(">trace(matrix)</SelectItem>
                  <SelectItem value="diag(">diag(matrix)</SelectItem>
                  <SelectItem value="dot(">dot(vector1, vector2)</SelectItem>
                  <SelectItem value="cross(">
                    cross(vector1, vector2)
                  </SelectItem>
                </>
              )}
              {functionGroup === "Special" && (
                <>
                  <SelectItem value="erf(">erf(var)</SelectItem>
                  <SelectItem value="gamma(">gamma(var)</SelectItem>
                  <SelectItem value="factorial(">factorial(var)</SelectItem>
                  <SelectItem value="combinations(">
                    combinations(n,k)
                  </SelectItem>
                  <SelectItem value="permutations(">
                    permutations(n,k)
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => handleAddToExpression(selectedFunction)}
            disabled={!selectedFunction}
          >
            Add Function to Expression
          </Button>
        </div>

        {/* Additional Input Field */}
        <div className="col-span-12">
          <Label htmlFor="additional-input">Additional Input</Label>
          <Input
            id="additional-input"
            value={additionalInput}
            onChange={(e) => setAdditionalInput(e.target.value)}
          />
        </div>
      </div>
      {/* Type & Label Modal */}
      {showTypeLabelModal && (
        <Dialog open onOpenChange={() => setShowTypeLabelModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Type & Label</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="variable-type">Variable Type</Label>
                <Select
                  value={variableType}
                  onValueChange={(value) =>
                    setVariableType(value as Variable["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMERIC">Numeric</SelectItem>
                    <SelectItem value="STRING">String</SelectItem>
                    <SelectItem value="DATE">Date</SelectItem>
                    <SelectItem value="COMMA">Comma</SelectItem>
                    <SelectItem value="DOT">Dot</SelectItem>
                    <SelectItem value="SCIENTIFIC">Scientific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="variable-label">Variable Label</Label>
                <Input
                  id="variable-label"
                  value={variableLabel}
                  onChange={(e) => setVariableLabel(e.target.value)}
                  placeholder="Enter a descriptive label"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTypeLabelModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  // Render as dialog
  if (containerType === "dialog") {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            {/* Remove the title here since ModalRenderer already provides one */}
          </DialogHeader>
          <ModalContent />
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCompute}
              disabled={!targetVariable || !numericExpression || isCalculating}
            >
              {isCalculating ? "Computing..." : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render as sidebar
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-6">
        <ModalContent />
      </div>
      <div className="px-6 py-4 border-t border-border mt-auto flex justify-end space-x-2 bg-muted/50">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCompute}
          disabled={!targetVariable || !numericExpression || isCalculating}
        >
          {isCalculating ? "Computing..." : "OK"}
        </Button>
      </div>
    </div>
  );
};

export default ComputeVariableModal;
