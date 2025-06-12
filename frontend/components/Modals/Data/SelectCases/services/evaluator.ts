import { Variable } from "@/types/Variable";

/**
 * Evaluates a condition expression against a data row
 * @param expression Condition expression to evaluate
 * @param row Data row to evaluate against
 * @param variables Array of variables with column mappings
 * @returns Boolean result of the condition evaluation
 */
export function evaluateCondition(expression: string, row: any[], variables: Variable[]): boolean {
  try {
    // Build variable map for easy access
    const varMap = new Map<string, any>();
    variables.forEach(variable => {
      varMap.set(variable.name, row[variable.columnIndex]);
    });

    // Replace variable names with their values in the expression
    let processedExpression = expression;
    
    // Process function calls first
    processedExpression = processFunctions(processedExpression, row, variables);
    
    // Replace variable names with their values
    // Use Array.from() to convert Map entries to an array before iterating
    Array.from(varMap.entries()).forEach(([varName, value]) => {
      // Use regex to match whole words only
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      
      // Convert to appropriate type based on the comparison
      if (typeof value === 'string') {
        processedExpression = processedExpression.replace(regex, `"${value}"`);
      } else if (value === null || value === undefined) {
        processedExpression = processedExpression.replace(regex, 'null');
      } else {
        processedExpression = processedExpression.replace(regex, value.toString());
      }
    });

    // Replace comparison operators
    processedExpression = processedExpression
      .replace(/==/g, '===')
      .replace(/!=/g, '!==')
      .replace(/&/g, '&&')
      .replace(/\|/g, '||')
      .replace(/~/g, '!');
    
    // Safely evaluate the expression
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + processedExpression)();
    return !!result;
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
}

/**
 * Process functions in the expression
 * @param expression Expression containing functions
 * @param row Data row
 * @param variables Array of variables
 * @returns Processed expression with function calls replaced by their results
 */
function processFunctions(expression: string, row: any[], variables: Variable[]): string {
  let result = expression;
  
  // Process different function types
  
  // Math functions
  result = processFunction(result, "ABS", (args) => Math.abs(parseFloat(args[0])));
  result = processFunction(result, "SQRT", (args) => {
    const value = parseFloat(args[0]);
    if (value < 0) throw new Error("Cannot take square root of negative number");
    return Math.sqrt(value);
  });
  result = processFunction(result, "ROUND", (args) => Math.round(parseFloat(args[0])));
  result = processFunction(result, "FLOOR", (args) => Math.floor(parseFloat(args[0])));
  result = processFunction(result, "CEIL", (args) => Math.ceil(parseFloat(args[0])));
  result = processFunction(result, "INT", (args) => Math.floor(parseFloat(args[0])));
  result = processFunction(result, "MAX", (args) => {
    if (args.length === 0) throw new Error("MAX function requires at least one argument");
    return Math.max(...args.map(a => parseFloat(a)));
  });
  result = processFunction(result, "MIN", (args) => {
    if (args.length === 0) throw new Error("MIN function requires at least one argument");
    return Math.min(...args.map(a => parseFloat(a)));
  });
  result = processFunction(result, "SUM", (args) => {
    if (args.length === 0) throw new Error("SUM function requires at least one argument");
    return args.reduce((sum, val) => sum + parseFloat(val), 0);
  });
  result = processFunction(result, "POW", (args) => {
    if (args.length !== 2) throw new Error("POW function requires exactly two arguments");
    return Math.pow(parseFloat(args[0]), parseFloat(args[1]));
  });
  result = processFunction(result, "EXP", (args) => Math.exp(parseFloat(args[0])));
  result = processFunction(result, "LOG", (args) => {
    const value = parseFloat(args[0]);
    if (value <= 0) throw new Error("Cannot take logarithm of non-positive number");
    return Math.log(value);
  });
  result = processFunction(result, "LOG10", (args) => {
    const value = parseFloat(args[0]);
    if (value <= 0) throw new Error("Cannot take logarithm of non-positive number");
    return Math.log10(value);
  });
  
  // Statistical functions
  result = processFunction(result, "MEAN", (args) => {
    if (args.length === 0) throw new Error("MEAN function requires at least one argument");
    const numbers = args.map(a => parseFloat(a));
    return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  });
  
  result = processFunction(result, "MEDIAN", (args) => {
    if (args.length === 0) throw new Error("MEDIAN function requires at least one argument");
    const numbers = args.map(a => parseFloat(a)).sort((a, b) => a - b);
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 === 0 ? (numbers[mid - 1] + numbers[mid]) / 2 : numbers[mid];
  });
  
  result = processFunction(result, "SD", (args) => {
    if (args.length <= 1) throw new Error("SD function requires at least two arguments");
    const numbers = args.map(a => parseFloat(a));
    const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
    const squareDiffs = numbers.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / (numbers.length - 1));
  });
  
  result = processFunction(result, "MISSING", (args) => {
    if (args.length === 0) throw new Error("MISSING function requires one argument");
    const varName = args[0].replace(/['"]/g, '');
    const variable = variables.find(v => v.name === varName);
    if (!variable) return false;
    
    const value = row[variable.columnIndex];
    return value === null || value === undefined || value === '';
  });
  
  result = processFunction(result, "NMISS", (args) => {
    let count = 0;
    for (const arg of args) {
      // Check if the arg is a variable name
      const varName = arg.replace(/['"]/g, '');
      const variable = variables.find(v => v.name === varName);
      if (variable) {
        const value = row[variable.columnIndex];
        if (value === null || value === undefined || value === '') {
          count++;
        }
      }
    }
    return count;
  });
  
  result = processFunction(result, "COUNT", (args) => {
    return args.length;
  });
  
  // Text functions
  result = processFunction(result, "CONCAT", (args) => args.join(''));
  result = processFunction(result, "LENGTH", (args) => args[0].toString().length);
  result = processFunction(result, "LOWER", (args) => args[0].toString().toLowerCase());
  result = processFunction(result, "UPPER", (args) => args[0].toString().toUpperCase());
  result = processFunction(result, "TRIM", (args) => args[0].toString().trim());
  result = processFunction(result, "SUBSTR", (args) => {
    if (args.length < 2) throw new Error("SUBSTR function requires at least two arguments");
    const str = args[0].toString();
    const start = parseInt(args[1]);
    const len = args.length > 2 ? parseInt(args[2]) : str.length - start;
    return str.substr(start, len);
  });
  result = processFunction(result, "REPLACE", (args) => {
    if (args.length !== 3) throw new Error("REPLACE function requires three arguments");
    const str = args[0].toString();
    const search = args[1].toString();
    const replacement = args[2].toString();
    return str.replace(new RegExp(search, 'g'), replacement);
  });
  
  // Conditional functions
  result = processFunction(result, "IF", (args) => {
    if (args.length !== 3) throw new Error("IF function requires three arguments");
    const condition = args[0].toLowerCase();
    const trueVal = args[1];
    const falseVal = args[2];
    return (condition === 'true' || condition === '1' || parseFloat(condition) !== 0) ? trueVal : falseVal;
  });
  
  return result;
}

/**
 * Process a specific function in an expression
 * @param expression Expression containing the function
 * @param funcName Name of the function to process
 * @param evaluator Function to evaluate the arguments
 * @returns Processed expression with function call replaced by its result
 */
function processFunction(expression: string, funcName: string, evaluator: (args: string[]) => any): string {
  const regex = new RegExp(`${funcName}\\(([^)]+)\\)`, 'gi');
  
  return expression.replace(regex, (match, argsStr) => {
    // Split arguments by comma, but handle commas inside string literals
    const args = parseArgs(argsStr);
    const result = evaluator(args);
    return result.toString();
  });
}

/**
 * Parse function arguments, handling commas in string literals
 * @param argsStr String containing function arguments
 * @returns Array of argument strings
 */
function parseArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    
    if ((char === '"' || char === "'") && (i === 0 || argsStr[i-1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      current += char;
    } else if (char === ',' && !inString) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
} 