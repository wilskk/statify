/**
 * Order of regression models used for output sorting.
 * @type {string[]}
 */
const MODEL_ORDER = [
  "Linear",
  "Logarithmic",
  "Inverse",
  "Quadratic",
  "Cubic",
  "Compound",
  "Power",
  "S",
  "Growth",
  "Exponential",
  "Logistic"
];

/**
 * Calculate the arithmetic mean of a numeric array.
 * @param {number[]} arr - Input values.
 * @returns {number} Mean value.
 */
const mean = (arr) => {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

/**
 * Ordinary least squares simple linear regression.
 * @param {number[]} x - Predictor values.
 * @param {number[]} y - Response values.
 * @returns {{b0:number,b1:number,r2:number,f:number,df1:number,df2:number,sig:number,predict:(val:number)=>number}}
 */
const linearRegression = (x, y) => {
  const n = x.length;
  const xMean = mean(x);
  const yMean = mean(y);
  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
  const b1 = numerator / denominator;
  const b0 = yMean - b1 * xMean;
  const yPred = x.map(xi => b0 + b1 * xi);
  const ssRes = y.reduce((sum, yi, i) => sum + (yi - yPred[i]) ** 2, 0);
  const ssTot = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const df1 = 1;
  const df2 = n - 2;
  const f = (r2 / df1) / ((1 - r2) / df2);
  const sig = 1 - fCDF(f, df1, df2);
  return { b0, b1, r2, f, df1, df2, sig, predict: (val) => b0 + b1 * val };
};

/**
 * Invert a square matrix using Gauss-Jordan elimination.
 * @param {number[][]} M - Square matrix.
 * @returns {number[][]} Inverted matrix.
 * @throws {Error} If the matrix is singular.
 */
const inverseMatrixGaussJordan = (M) => {
  const n = M.length;
  let A = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let pivot = A[i][i];
    if (pivot === 0) {
      for (let r = i + 1; r < n; r++) {
        if (A[r][i] !== 0) {
          [A[i], A[r]] = [A[r], A[i]];
          pivot = A[i][i];
          break;
        }
      }
      if (pivot === 0) throw new Error("Matrix is not invertible");
    }
    A[i] = A[i].map(value => value / pivot);
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = A[r][i];
        A[r] = A[r].map((val, c) => val - factor * A[i][c]);
      }
    }
  }
  return A.map(row => row.slice(n));
};

/**
 * Transpose a matrix.
 * @param {number[][]} matrix - Input matrix (m x n).
 * @returns {number[][]} Transposed matrix (n x m).
 */
const transposeMatrix = (matrix) => {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

/**
 * Multiply two matrices A (m x p) and B (p x n).
 * @param {number[][]} A - Left matrix.
 * @param {number[][]} B - Right matrix.
 * @returns {number[][]} Product matrix (m x n).
 */
const multiplyMatrices = (A, B) => {
  const result = [];
  for (let i = 0; i < A.length; i++) {
    result[i] = [];
    for (let j = 0; j < B[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < A[0].length; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
};

/**
 * Ordinary least squares multiple linear regression.
 * X is expected to include an intercept term (first column of 1s).
 * @param {number[][]} X - Design matrix with intercept.
 * @param {number[]} Y - Response vector.
 * @returns {{coefficients:number[],r2:number,f:number,df1:number,df2:number,sig:number,predict:(xArr:number[])=>number}}
 */
const multipleLinearRegression = (X, Y) => {
  const n = Y.length;
  const k = X[0].length - 1;
  const XT = transposeMatrix(X);
  const XTX = multiplyMatrices(XT, X);
  const XTY = multiplyMatrices(XT, Y.map(y => [y]));
  const XTX_inv = inverseMatrixGaussJordan(XTX);
  const B = multiplyMatrices(XTX_inv, XTY);
  const coefficients = B.map(row => row[0]);
  const yMean = mean(Y);
  const yPred = X.map(row => row.reduce((sum, val, i) => sum + val * coefficients[i], 0));
  const ssRes = Y.reduce((sum, yi, i) => sum + (yi - yPred[i]) ** 2, 0);
  const ssTot = Y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const df1 = k;
  const df2 = n - k - 1;
  const f = (r2 / df1) / ((1 - r2) / df2);
  const sig = 1 - fCDF(f, df1, df2);
  return {
    coefficients,
    r2,
    f,
    df1,
    df2,
    sig,
    predict: (xArr) => [1, ...xArr].reduce((sum, val, i) => sum + val * coefficients[i], 0)
  };
};

/**
 * Linear model: y = b0 + b1 x
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof linearRegression>}
 */
const tryLinear = (X, Y) => {
  return linearRegression(X, Y);
};

/**
 * Logarithmic model: y = b0 + b1 ln(x)
 * Returns null if any x <= 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof linearRegression>|null}
 */
const tryLogarithmic = (X, Y) => {
  if (X.some(x => x <= 0)) return null;
  const Xlog = X.map(x => Math.log(x));
  return linearRegression(Xlog, Y);
};

/**
 * Inverse model: y = b0 + b1 (1/x)
 * Returns null if any x = 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof linearRegression>|null}
 */
const tryInverse = (X, Y) => {
  if (X.some(x => x === 0)) return null;
  const Xinv = X.map(x => 1 / x);
  return linearRegression(Xinv, Y);
};

/**
 * Quadratic model: y = b0 + b1 x + b2 x^2
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof multipleLinearRegression>}
 */
const tryQuadratic = (X, Y) => {
  const Xmat = X.map(x => [1, x, x ** 2]);
  return multipleLinearRegression(Xmat, Y);
};

/**
 * Cubic model: y = b0 + b1 x + b2 x^2 + b3 x^3
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof multipleLinearRegression>}
 */
const tryCubic = (X, Y) => {
  const Xmat = X.map(x => [1, x, x ** 2, x ** 3]);
  return multipleLinearRegression(Xmat, Y);
};

/**
 * Power model: y = b0 x^{b1}
 * Uses ln transforms; returns null if any x <= 0 or y <= 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {(ReturnType<typeof linearRegression> & {b0:number})|null}
 */
const tryPower = (X, Y) => {
  const filtered = X.map((x, i) => ({ x, y: Y[i] })).filter(d => d.x > 0 && d.y > 0);
  if (filtered.length < X.length) return null;
  const lnY = filtered.map(d => Math.log(d.y));
  const lnX = filtered.map(d => Math.log(d.x));
  const result = linearRegression(lnX, lnY);
  return { ...result, b0: Math.exp(result.b0) };
};

/**
 * Compound model: y = b0 b1^{x}
 * Uses ln(y) ~ a + b x; returns null if any y <= 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {(ReturnType<typeof linearRegression> & {b0:number,b1:number})|null}
 */
const tryCompound = (X, Y) => {
  const filtered = X.map((x, i) => ({ x, y: Y[i] })).filter(d => d.y > 0);
  if (filtered.length < X.length) return null;
  const lnY = filtered.map(d => Math.log(d.y));
  const Xpos = filtered.map(d => d.x);
  const result = linearRegression(Xpos, lnY);
  return { ...result, b0: Math.exp(result.b0), b1: Math.exp(result.b1) };
};

/**
 * S-curve model: ln(y) = b0 + b1 (1/x)
 * Requires y > 0 and x != 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof linearRegression>|null}
 */
const trySCurve = (X, Y) => {
  const filtered = X.map((x, i) => ({ x, y: Y[i] })).filter(d => d.y > 0 && d.x !== 0);
  if (filtered.length < X.length) return null;
  const lnY = filtered.map(d => Math.log(d.y));
  const invX = filtered.map(d => 1 / d.x);
  return linearRegression(invX, lnY);
};

/**
 * Growth model: ln(y) = b0 + b1 x
 * Requires y > 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {ReturnType<typeof linearRegression>|null}
 */
const tryGrowth = (X, Y) => {
  const filtered = X.map((x, i) => ({ x, y: Y[i] })).filter(d => d.y > 0);
  if (filtered.length < X.length) return null;
  const lnY = filtered.map(d => Math.log(d.y));
  const Xpos = filtered.map(d => d.x);
  return linearRegression(Xpos, lnY);
};

/**
 * Exponential model: y = b0 e^{b1 x}
 * Uses ln transform; requires y > 0.
 * @param {number[]} X
 * @param {number[]} Y
 * @returns {(ReturnType<typeof linearRegression> & {b0:number})|null}
 */
const tryExponential = (X, Y) => {
  const filtered = X.map((x, i) => ({ x, y: Y[i] })).filter(d => d.y > 0);
  if (filtered.length < X.length) return null;
  const lnY = filtered.map(d => Math.log(d.y));
  const Xpos = filtered.map(d => d.x);
  const result = linearRegression(Xpos, lnY);
  return { ...result, b0: Math.exp(result.b0) };
};

/**
 * Fit logistic model for a specific upper bound c.
 * Model: y = 1 / (1/c + b0 * b1^x)
 * @param {number[]} X - Predictor values.
 * @param {number[]} Y - Response values.
 * @param {number} c - Upper bound (> max(Y)).
 * @returns {{b0:number,b1:number,c:number,r2:number,f:number,df1:number,df2:number,sig:number,isEstimated:boolean}}
 */
const fitLogisticWithC = (X, Y, c) => {
  const yMax = Math.max(...Y);
  if (c <= yMax) {
    c = yMax * 1.001;
  }

  const validData = X.map((x, i) => ({ x, y: Y[i] }))
    .filter(d => d.y > 0 && d.y < c);

  if (validData.length < 3 || validData.length < X.length * 0.2) {
    return {
      b0: 0,
      b1: 0,
      c,
      r2: 0,
      f: 0,
      df1: 1,
      df2: X.length - 2,
      sig: 1,
      isEstimated: true,
    };
  }

  const transformedY = [];
  const filteredX = [];
  for (let i = 0; i < validData.length; i++) {
    const term = (1 / validData[i].y) - (1 / c);
    if (term > 0) {
      transformedY.push(Math.log(term));
      filteredX.push(validData[i].x);
    }
  }

  if (transformedY.length < 3) {
    return {
      b0: 0,
      b1: 0,
      c,
      r2: 0,
      f: 0,
      df1: 1,
      df2: X.length - 2,
      sig: 1,
      isEstimated: true,
    };
  }

  const linReg = linearRegression(filteredX, transformedY);
  if (!linReg) {
    return {
      b0: 0,
      b1: 0,
      c,
      r2: 0,
      f: 0,
      df1: 1,
      df2: X.length - 2,
      sig: 1,
      isEstimated: true,
    };
  }

  const b0_logistic = Math.exp(linReg.b0);
  const b1_logistic = Math.exp(linReg.b1);

  const yPred = validData.map(d => {
    const denom = (1 / c) + b0_logistic * Math.pow(b1_logistic, d.x);
    return denom === 0 || !isFinite(denom) ? c : 1 / denom;
  });

  const yActual = validData.map(d => d.y);
  const yMean = mean(yActual);
  const ssRes = yActual.reduce((sum, y, i) => sum + (y - yPred[i]) ** 2, 0);
  const ssTot = yActual.reduce((sum, y) => sum + (y - yMean) ** 2, 0);

  let r2 = 0;
  if (ssTot > 0) {
    r2 = 1 - ssRes / ssTot;
  } else if (ssRes === 0) {
    r2 = 1;
  }

  return {
    b0: b0_logistic,
    b1: b1_logistic,
    c,
    r2,
    f: linReg.f,
    df1: linReg.df1,
    df2: linReg.df2,
    sig: linReg.sig,
    isEstimated: false,
  };
};

/**
 * Logistic model with automatic upper-bound handling.
 * If upperBound is invalid/missing or <= max(Y), a default of 1.02 * max(Y) is used.
 * @param {number[]} X
 * @param {number[]} Y
 * @param {number|string|undefined} upperBound - User-specified upper bound.
 * @returns {ReturnType<typeof fitLogisticWithC>}
 */
const tryLogistic = (X, Y, upperBound) => {
  console.log("Logistic regression started with upperBound:", upperBound);

  const yMax = Math.max(...Y);

  let c = parseFloat(upperBound);
  if (!upperBound || isNaN(c) || c <= yMax) {
    c = yMax * 1.02;
  }

  return fitLogisticWithC(X, Y, c);
};

/**
 * Continued fraction approximation for the incomplete beta function.
 * @param {number} a
 * @param {number} b
 * @param {number} x
 * @returns {number}
 */
const betacf = (a, b, x) => {
  const MAX_ITER = 100;
  const EPS = 3.0e-7;
  let am = 1;
  let bm = 1;
  let az = 1;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let bz = 1 - qab * x / qap;
  for (let m = 1; m <= MAX_ITER; m++) {
    let em = m;
    let tem = em + em;
    let d = em * (b - m) * x / ((qam + tem) * (a + tem));
    let ap = az + d * am;
    let bp = bz + d * bm;
    d = -(a + em) * (qab + em) * x / ((a + tem) * (qap + tem));
    let app = ap + d * az;
    let bpp = bp + d * bz;
    let aold = az;
    am = ap / bpp;
    bm = bp / bpp;
    az = app / bpp;
    bz = 1;
    if (Math.abs(az - aold) < (EPS * Math.abs(az))) break;
  }
  return az;
};

/**
 * Regularized incomplete beta function I_x(a, b).
 * @param {number} a
 * @param {number} b
 * @param {number} x - In [0, 1].
 * @returns {number}
 */
const betai = (a, b, x) => {
  if (x < 0 || x > 1) throw new Error("Bad x in betai");
  if (x === 0 || x === 1) return x;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betacf(a, b, x) / a;
  } else {
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
};

/**
 * Natural log gamma function via Lanczos approximation.
 * @param {number} x
 * @returns {number}
 */
const gammaln = (x) => {
  const cof = [
    76.18009172947146, -86.50532032941677,
    24.01409824083091, -1.231739572450155,
    0.001208650973866179, -0.000005395239384953
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < cof.length; j++) {
    ser += cof[j] / (++y);
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
};

/**
 * CDF of the F-distribution using the incomplete beta function.
 * @param {number} f - F statistic.
 * @param {number} df1 - Numerator degrees of freedom.
 * @param {number} df2 - Denominator degrees of freedom.
 * @returns {number}
 */
const fCDF = (f, df1, df2) => {
  const x = (df1 * f) / (df1 * f + df2);
  return betai(df1 / 2, df2 / 2, x);
};

/**
 * Build summary tables for selected curve estimation models.
 * @param {string[]} models - Model names to evaluate.
 * @param {number[]} X - Predictor values.
 * @param {number[]} Y - Response values.
 * @param {{upperBound?: number|string}} [options] - Optional parameters.
 * @returns {{tables: Array<{title:string,columnHeaders:Array<object>,rows:Array<object>}>}}
 */
const generateRegressionSummary = (models, X, Y, options = {}) => {
  const sortedModels = models.sort((a, b) => {
    const indexA = MODEL_ORDER.indexOf(a);
    const indexB = MODEL_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const rows = sortedModels.map(model => {
    let result = {};
    switch (model) {
      case 'Linear':
        const lin = tryLinear(X, Y);
        result = {
          rowHeader: ["Linear"],
          "R Square": lin.r2.toFixed(3),
          "R Square_raw": lin.r2,
          "F": lin.f.toFixed(3),
          "F_raw": lin.f,
          "df1": lin.df1,
          "df2": lin.df2,
          "p-value": lin.sig.toFixed(3),
          "Sig_raw": lin.sig,
          "Constant": lin.b0.toFixed(3),
          "Constant_raw": lin.b0,
          "b1": lin.b1.toFixed(3),
          "b1_raw": lin.b1,
          "b2": "",
          "b2_raw": null,
          "b3": "",
          "b3_raw": null
        };
        break;

      case 'Logarithmic':
        const log = tryLogarithmic(X, Y);
        if (log) {
          result = {
            rowHeader: ["Logarithmic"],
            "R Square": log.r2.toFixed(3),
            "R Square_raw": log.r2,
            "F": log.f.toFixed(3),
            "F_raw": log.f,
            "df1": log.df1,
            "df2": log.df2,
             "p-value": log.sig.toFixed(3),
            "Sig_raw": log.sig,
            "Constant": log.b0.toFixed(3),
            "Constant_raw": log.b0,
            "b1": log.b1.toFixed(3),
            "b1_raw": log.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["Logarithmic"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'Inverse':
        const inv = tryInverse(X, Y);
        if (inv) {
          result = {
            rowHeader: ["Inverse"],
            "R Square": inv.r2.toFixed(3),
            "R Square_raw": inv.r2,
            "F": inv.f.toFixed(3),
            "F_raw": inv.f,
            "df1": inv.df1,
            "df2": inv.df2,
             "p-value": inv.sig.toFixed(3),
            "Sig_raw": inv.sig,
            "Constant": inv.b0.toFixed(3),
            "Constant_raw": inv.b0,
            "b1": inv.b1.toFixed(3),
            "b1_raw": inv.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["Inverse"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'Quadratic':
        const quad = tryQuadratic(X, Y);
        result = {
          rowHeader: ["Quadratic"],
          "R Square": quad.r2.toFixed(3),
          "R Square_raw": quad.r2,
          "F": quad.f.toFixed(3),
          "F_raw": quad.f,
          "df1": quad.df1,
          "df2": quad.df2,
          "p-value": quad.sig.toFixed(3),
          "Sig_raw": quad.sig,
          "Constant": quad.coefficients[0].toFixed(3),
          "Constant_raw": quad.coefficients[0],
          "b1": quad.coefficients[1].toFixed(3),
          "b1_raw": quad.coefficients[1],
          "b2": quad.coefficients[2].toFixed(3),
          "b2_raw": quad.coefficients[2],
          "b3": "",
          "b3_raw": null
        };
        break;

      case 'Cubic':
        const cubic = tryCubic(X, Y);
        result = {
          rowHeader: ["Cubic"],
          "R Square": cubic.r2.toFixed(3),
          "R Square_raw": cubic.r2,
          "F": cubic.f.toFixed(3),
          "F_raw": cubic.f,
          "df1": cubic.df1,
          "df2": cubic.df2,
          "p-value": cubic.sig.toFixed(3),
          "Sig_raw": cubic.sig,
          "Constant": cubic.coefficients[0].toFixed(3),
          "Constant_raw": cubic.coefficients[0],
          "b1": cubic.coefficients[1].toFixed(3),
          "b1_raw": cubic.coefficients[1],
          "b2": cubic.coefficients[2].toFixed(3),
          "b2_raw": cubic.coefficients[2],
          "b3": cubic.coefficients[3].toFixed(3),
          "b3_raw": cubic.coefficients[3]
        };
        break;

      case 'Compound':
        const compound = tryCompound(X, Y);
        if (compound) {
          result = {
            rowHeader: ["Compound"],
            "R Square": compound.r2.toFixed(3),
            "R Square_raw": compound.r2,
            "F": compound.f.toFixed(3),
            "F_raw": compound.f,
            "df1": compound.df1,
            "df2": compound.df2,
             "p-value": compound.sig.toFixed(3),
            "Sig_raw": compound.sig,
            "Constant": compound.b0.toFixed(3),
            "Constant_raw": compound.b0,
            "b1": compound.b1.toFixed(3),
            "b1_raw": compound.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["Compound"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'Power':
        const power = tryPower(X, Y);
        if (power) {
          result = {
            rowHeader: ["Power"],
            "R Square": power.r2.toFixed(3),
            "R Square_raw": power.r2,
            "F": power.f.toFixed(3),
            "F_raw": power.f,
            "df1": power.df1,
            "df2": power.df2,
             "p-value": power.sig.toFixed(3),
            "Sig_raw": power.sig,
            "Constant": power.b0.toFixed(3),
            "Constant_raw": power.b0,
            "b1": power.b1.toFixed(3),
            "b1_raw": power.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["Power"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'S':
        const sCurve = trySCurve(X, Y);
        if (sCurve) {
          result = {
            rowHeader: ["S"],
            "R Square": sCurve.r2.toFixed(3),
            "R Square_raw": sCurve.r2,
            "F": sCurve.f.toFixed(3),
            "F_raw": sCurve.f,
            "df1": sCurve.df1,
            "df2": sCurve.df2,
             "p-value": sCurve.sig.toFixed(3),
            "Sig_raw": sCurve.sig,
            "Constant": sCurve.b0.toFixed(3),
            "Constant_raw": sCurve.b0,
            "b1": sCurve.b1.toFixed(3),
            "b1_raw": sCurve.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["S"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'Growth':
        const growth = tryGrowth(X, Y);
        if (growth) {
          result = {
            rowHeader: ["Growth"],
            "R Square": growth.r2.toFixed(3),
            "R Square_raw": growth.r2,
            "F": growth.f.toFixed(3),
            "F_raw": growth.f,
            "df1": growth.df1,
            "df2": growth.df2,
             "p-value": growth.sig.toFixed(3),
            "Sig_raw": growth.sig,
            "Constant": growth.b0.toFixed(3),
            "Constant_raw": growth.b0,
            "b1": growth.b1.toFixed(3),
            "b1_raw": growth.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["Growth"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'Exponential':
        const exponential = tryExponential(X, Y);
        if (exponential) {
          result = {
            rowHeader: ["Exponential"],
            "R Square": exponential.r2.toFixed(3),
            "R Square_raw": exponential.r2,
            "F": exponential.f.toFixed(3),
            "F_raw": exponential.f,
            "df1": exponential.df1,
            "df2": exponential.df2,
             "p-value": exponential.sig.toFixed(3),
            "Sig_raw": exponential.sig,
            "Constant": exponential.b0.toFixed(3),
            "Constant_raw": exponential.b0,
            "b1": exponential.b1.toFixed(3),
            "b1_raw": exponential.b1,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        } else {
          result = {
            rowHeader: ["Exponential"],
            "R Square": "",
            "R Square_raw": null,
            "F": "",
            "F_raw": null,
            "df1": "",
            "df2": "",
             "p-value": "",
            "Sig_raw": null,
            "Constant": "",
            "Constant_raw": null,
            "b1": "",
            "b1_raw": null,
            "b2": "",
            "b2_raw": null,
            "b3": "",
            "b3_raw": null
          };
        }
        break;

      case 'Logistic': {
        const logistic = tryLogistic(X, Y, options.upperBound);
        let statsSource = logistic;
        if (!options.upperBound) {
          const growthStats = tryGrowth(X, Y);
          if (growthStats) {
            statsSource = { ...statsSource, ...growthStats };
          }
        }

        result = {
          rowHeader: ["Logistic"],
          "R Square": logistic.isEstimated ? "0.000" : statsSource.r2.toFixed(3),
          "R Square_raw": logistic.isEstimated ? 0 : statsSource.r2,
          "F": logistic.isEstimated ? "0.000" : statsSource.f.toFixed(3),
          "F_raw": logistic.isEstimated ? 0 : statsSource.f,
          "df1": statsSource.df1,
          "df2": statsSource.df2,
          "p-value": logistic.isEstimated ? "1.000" : statsSource.sig.toFixed(3),
          "Sig_raw": logistic.isEstimated ? 1 : statsSource.sig,
          "Constant": logistic.b0.toFixed(3),
          "Constant_raw": logistic.b0,
          "b1": logistic.b1.toFixed(3),
          "b1_raw": logistic.b1,
          "b2": options.upperBound ? logistic.c.toFixed(3) : "",
          "b2_raw": options.upperBound ? logistic.c : null,
          "b3": "",
          "b3_raw": null
        };
        break;
      }

      default:
        result = {
          rowHeader: [model],
          "R Square": "",
          "R Square_raw": null,
          "F": "",
          "F_raw": null,
          "df1": "",
          "df2": "",
          "p-value": "",
          "Sig_raw": null,
          "Constant": "",
          "Constant_raw": null,
          "b1": "",
          "b1_raw": null,
          "b2": "",
          "b2_raw": null,
          "b3": "",
          "b3_raw": null
        };
    }

    return result;
  });

  return {
    tables: [
      {
        title: "Model Summary and Parameter Estimates",
        columnHeaders: [
          { header: "Equation" },
          {
            header: "Model Summary",
            children: [
              { header: "R Square" },
              { header: "F" },
              { header: "df1" },
              { header: "df2" },
              { header: "p-value" }
            ]
          },
          {
            header: "Parameter Estimates",
            children: [
              { header: "Constant" },
              { header: "b1" },
              { header: "b2" },
              { header: "b3" }
            ]
          }
        ],
        rows: rows
      }
    ]
  };
};

/**
 * Handle worker messages.
 *
 * Supported action: 'runRegression'
 * - data: {
 *     models: string[],
 *     X: number[],
 *     Y: number[],
 *     dependentName: string,
 *     independentNames: string[],
 *     upperBound?: number|string
 *   }
 * Responds with action 'regressionResults' containing regression output and metadata.
 */
self.addEventListener('message', (event) => {
  try {
    const { action, data } = event.data;

    switch (action) {
      case 'runRegression':
        const { models, X, Y, dependentName, independentNames, upperBound } = data;

        console.log("Worker received data:", {
          models,
          dataPoints: X.length,
          upperBound: upperBound
        });

        const result = generateRegressionSummary(models, X, Y, { upperBound });

        const response = {
          success: true,
          result: result,
          metadata: {
            dependentVariable: dependentName,
            independentVariables: independentNames,
            numObservations: X.length,
            upperBoundUsed: upperBound
          }
        };

        self.postMessage({ action: 'regressionResults', data: response });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Worker error:", error);
    self.postMessage({
      action: 'error',
      data: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});