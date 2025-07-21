// importScripts(
//   "https://cdnjs.cloudflare.com/ajax/libs/mathjs/10.0.0/math.min.js"
// );

importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/mathjs/14.2.1/math.min.js"
);

// function mode(arr) {
//   const counts = {};
//   arr.forEach((val) => (counts[val] = (counts[val] || 0) + 1));
//   const maxCount = Math.max(...Object.values(counts));
//   const modes = Object.keys(counts)
//     .filter((k) => counts[k] === maxCount)
//     .map(Number);
//   return modes.length === 1 ? modes[0] : modes;
// }

// math.import({ mode: mode, cbrt: math.cbrt }, { override: true });

// Add all necessary functions
math.import(
  {
    ln: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("ln() function only accepts one parameter");
      }
      return math.log(x);
    },
    arcos: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("arcos() function only accepts one parameter");
      }
      return math.acos(x);
    },
    arsin: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("arsin() function only accepts one parameter");
      }
      return math.asin(x);
    },
    artan: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("artan() function only accepts one parameter");
      }
      return math.atan(x);
    },
    MODE: function (...args) {
      const flat = args.flat();
      return math.mode(flat);
    },
    var_p: function (...args) {
      const data = args.flat();
      return math.variance(data, "uncorrected");
    },

    var_s: function (...args) {
      const data = args.flat();
      return math.variance(data, "unbiased");
    },
    std_p: function (...args) {
      const data = args.flat();
      return math.std(data, "uncorrected");
    },
    std_s: function (...args) {
      const data = args.flat();
      return math.std(data, "unbiased");
    },

    // log1p: function (x) {
    //   return math.log1p(x);
    // },
    // log2: function (x) {
    //   return math.log2(x);
    // },
    // log: function (x, base) {
    //   return math.log(x, base);
    // },
    // log10: function (x) {
    //   return math.log10(x);
    // },
    // abs: function (x) {
    //   return math.abs(x);
    // },
    // sqrt: function (x) {
    //   return math.sqrt(x);
    // },
    // cbrt: function (x) {
    //   return math.cbrt(x);
    // },
    // exp: function (x) {
    //   return math.exp(x);
    // },
    // cube: function (x) {
    //   return math.pow(x, 3);
    // },
    // square: function (x) {
    //   return math.pow(x, 2);
    // },
    // round: function (x, decimals) {
    //   return math.round(x, decimals);
    // },
    // fix: function (x) {
    //   return math.floor(x);
    // },
    // trunc: function (x) {
    //   return math.trunc(x);
    // },
  },
  { override: true }
);

// Helper function to safely evaluate expressions
function safeEvaluate(expression, context) {
  try {
    // 👉 Tangani fungsi kolom secara khusus di awal
    const colFuncMatch = expression.match(
      /^\s*(colmean|colsum|colmedian|colmin|colmax|colvar_p|colvar_s|colstd_p|colstd_s)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*$/
    );
    if (colFuncMatch) {
      const [_, funcName, varName] = colFuncMatch;
      if (!self.variables || !self.data) {
        throw new Error("Data dan variabel tidak tersedia untuk fungsi kolom");
      }

      const variable = self.variables.find((v) => v.name === varName);
      if (!variable) throw new Error(`Variabel '${varName}' tidak ditemukan`);

      const colIdx = variable.columnIndex;
      const colValues = self.data
        .map((row) =>
          variable.type === "Numeric" ? parseFloat(row[colIdx]) : row[colIdx]
        )
        .filter((v) => !isNaN(v));

      if (colValues.length === 0) {
        throw new Error(`Tidak ada nilai numerik valid di kolom '${varName}'`);
      }

      let result;
      switch (funcName) {
        case "colmean":
          result = math.mean(colValues);
          break;
        case "colsum":
          result = math.sum(colValues);
          break;
        case "colmedian":
          result = math.median(colValues);
          break;
        case "colmin":
          result = math.min(colValues);
          break;
        case "colmax":
          result = math.max(colValues);
          break;
        case "colvar_p":
          result = math.var_p(colValues);
          break;
        case "colvar_s":
          result = math.var_s(colValues);
          break;
        case "colstd_p":
          result = math.std_p(colValues);
          break;
        case "colstd_s":
          result = math.std_s(colValues);
          break;
        default:
          throw new Error(`Fungsi '${funcName}' tidak didukung`);
      }

      return result; // ✅ langsung kembalikan nilai
    }

    // 👉 Lanjut proses biasa
    let processedExpr = expression;
    const functionRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([^)]+)\s*\)/g;

    processedExpr = processedExpr.replace(
      functionRegex,
      (match, funcName, args) => {
        const func = math[funcName];
        if (typeof func === "function") {
          const argValues = args.split(",").map((arg) => {
            const trimmed = arg.trim();
            return context.hasOwnProperty(trimmed)
              ? context[trimmed]
              : parseFloat(trimmed);
          });
          return func(...argValues);
        }
        return match;
      }
    );

    return math.evaluate(processedExpr, context);
  } catch (error) {
    // Deteksi error undefined symbol
    if (error.message && error.message.startsWith("Undefined symbol ")) {
      // Ambil nama symbol
      const match = error.message.match(/Undefined symbol ([^ ]+)/);
      const symbol = match ? match[1] : "?";
      throw new Error(
        `Unknown expression '${symbol}'. Did you mean something else?`
      );
    }
    throw new Error(`Error evaluating expression: ${error.message}`);
  }
}

self.onmessage = function (event) {
  const { data, variables, numericExpression, variableType, roundDecimals } =
    event.data;

  // Store data and variables globally for colmean function
  self.data = data;
  self.variables = variables;

  try {
    let computedValues;

    const isGlobalAggregateOnly =
      /^\s*(colmean|colsum|colmedian|colmin|colmax|colvar_p|colvar_s|colstd_p|colstd_s)\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)\s*$/i.test(
        numericExpression
      );

    if (isGlobalAggregateOnly) {
      // Evaluasi sekali saja
      const result = safeEvaluate(numericExpression, {}); // kosongkan context

      // Hanya kembalikan satu baris hasil
      computedValues = [
        variableType === "Numeric" ? result.toString() : String(result),
      ];
    } else {
      // Preprocess untuk mendapatkan nilai fungsi kolom terlebih dahulu
      let processedExpr = numericExpression;
      const colFuncRegex =
        /(colmean|colsum|colmedian|colmin|colmax|colvar_p|colvar_s|colstd_p|colstd_s)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;

      // Ganti semua fungsi kolom dengan nilainya
      processedExpr = processedExpr.replace(
        colFuncRegex,
        (match, funcName, varName) => {
          const variable = self.variables.find((v) => v.name === varName);
          if (!variable)
            throw new Error(`Variabel '${varName}' tidak ditemukan`);

          const colIdx = variable.columnIndex;
          const colValues = self.data
            .map((row) =>
              variable.type === "Numeric"
                ? parseFloat(row[colIdx])
                : row[colIdx]
            )
            .filter((v) => !isNaN(v));

          if (colValues.length === 0) {
            throw new Error(
              `Tidak ada nilai numerik valid di kolom '${varName}'`
            );
          }

          let result;
          switch (funcName) {
            case "colmean":
              result = math.mean(colValues);
              break;
            case "colsum":
              result = math.sum(colValues);
              break;
            case "colmedian":
              result = math.median(colValues);
              break;
            case "colmin":
              result = math.min(colValues);
              break;
            case "colmax":
              result = math.max(colValues);
              break;
            case "colvar_p":
              result = math.var_p(colValues);
              break;
            case "colvar_s":
              result = math.var_s(colValues);
              break;
            case "colstd_p":
              result = math.std_p(colValues);
              break;
            case "colstd_s":
              result = math.std_s(colValues);
              break;
            default:
              throw new Error(`Fungsi '${funcName}' tidak didukung`);
          }

          return result.toString();
        }
      );

      computedValues = data.map((row, rowIndex) => {
        const context = {};

        variables.forEach((variable) => {
          const colIndex = variable.columnIndex;
          const cellValue = row[colIndex];
          context[variable.name] =
            variable.type === "Numeric" ? parseFloat(cellValue) : cellValue;
        });

        let computedValue;
        try {
          computedValue = safeEvaluate(processedExpr, context);
        } catch (error) {
          throw new Error(
            `An error occurred on row ${rowIndex + 1}: ${
              error.message
            }. Please check your formula.`
          );
        }

        if (computedValue === undefined || Number.isNaN(computedValue))
          throw new Error(
            `An error occurred on row ${
              rowIndex + 1
            }: The expression is invalid. Please review your formula for missing parentheses or typos.\nDetails: ${
              error.message
            }`
          );

        // Apply rounding if needed
        if (roundDecimals !== null && roundDecimals !== undefined) {
          computedValue = math.round(computedValue, roundDecimals);
        }

        return variableType === "Numeric"
          ? computedValue.toString()
          : String(computedValue);
      });
    }

    const tableData = {
      title: "Computed Values",
      columns: ["variabel target"],
      rows: computedValues.map((value) => ({ "variabel target": value })),
    };

    self.postMessage({ success: true, computedValues, tableData });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || error.toString(),
    });
  }
};
