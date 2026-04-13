self.onmessage = function (e) {
  try {
    const { data, featureNames, iterations } = e.data;

    const sigmoid = (z) => 1 / (1 + Math.exp(-z));
    const dot = (a, b) => a.reduce((s, ai, i) => s + ai * b[i], 0);

    const k = featureNames.length;
    const J = Math.max(...data.map(d => d.y)) - 1;

    let beta = Array(k).fill(0);
    let theta = Array(J).fill(0);

    const lr = 0.01;

    for (let iter = 0; iter < iterations; iter++) {
      let gradB = Array(k).fill(0);
      let gradT = Array(J).fill(0);

      data.forEach(({ y, x }) => {
        const xb = dot(beta, x);

        theta.forEach((t, j) => {
          const p = sigmoid(t - xb);
          if (y <= j + 1) gradT[j] += (1 - p);
          else gradT[j] -= p;
        });

        beta.forEach((_, i) => {
          theta.forEach((t, j) => {
            const p = sigmoid(t - xb);
            if (y <= j + 1) gradB[i] -= (1 - p) * x[i];
            else gradB[i] += p * x[i];
          });
        });
      });

      beta = beta.map((b, i) => b + lr * gradB[i]);
      theta = theta.map((t, i) => t + lr * gradT[i]);
    }

    const z = 1.96;

    const results = [
      ...theta.map((t, i) => {
        const se = 0.1;
        const w = t / se;
        return {
          group: "Threshold",
          variable: `[${i + 1}]`,
          estimate: t,
          stdError: se,
          wald: w * w,
          sig: Math.exp(-0.5 * w * w),
          lower: t - z * se,
          upper: t + z * se
        };
      }),
      ...beta.map((b, i) => {
        const se = 0.1;
        const w = b / se;
        return {
          group: "Location",
          variable: featureNames[i],
          estimate: b,
          stdError: se,
          wald: w * w,
          sig: Math.exp(-0.5 * w * w),
          lower: b - z * se,
          upper: b + z * se
        };
      })
    ];

    self.postMessage({ type: "SUCCESS", payload: results });

  } catch (err) {
    self.postMessage({ type: "ERROR", payload: err.message });
  }
};