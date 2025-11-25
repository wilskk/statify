import { Variable } from "@/types/Variable";

// Tipe data dari Rust (sesuai struct LogisticResult)
interface LogisticResult {
  model_summary: {
    log_likelihood: number;
    cox_snell_r2: number;
    nagelkerke_r2: number;
  };
  classification_table: {
    predicted_0_observed_0: number;
    predicted_1_observed_0: number;
    predicted_0_observed_1: number;
    predicted_1_observed_1: number;
    overall_percentage: number;
  };
  variables_in_equation: Array<{
    label: string;
    b: number;
    se: number;
    wald: number;
    df: number;
    sig: number;
    exp_b: number;
  }>;
  omni_tests: {
    chi_square: number;
    df: number;
    sig: number;
  };
}

// Helper untuk format angka
const fmt = (num: number, digits = 3) => num.toFixed(digits);
const fmtSig = (num: number) => (num < 0.001 ? "< .001" : num.toFixed(3));

export const formatBinaryLogisticResult = (
  result: LogisticResult,
  dependentName: string
) => {
  let html = `<div class="statify-result-container">`;
  html += `<h3>Logistic Regression (Method: Enter)</h3>`;

  // 1. Omnibus Tests
  html += `
    <h4>Omnibus Tests of Model Coefficients</h4>
    <table class="statify-table" style="width: 100%; border-collapse: collapse; text-align: right;">
      <thead>
        <tr style="border-bottom: 2px solid black; border-top: 2px solid black;">
          <th style="text-align: left; padding: 5px;"></th>
          <th style="padding: 5px;">Chi-square</th>
          <th style="padding: 5px;">df</th>
          <th style="padding: 5px;">Sig.</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: left; padding: 5px;">Model</td>
          <td style="padding: 5px;">${fmt(result.omni_tests.chi_square)}</td>
          <td style="padding: 5px;">${result.omni_tests.df}</td>
          <td style="padding: 5px;">${fmtSig(result.omni_tests.sig)}</td>
        </tr>
      </tbody>
      <tfoot style="border-top: 2px solid black;"></tfoot>
    </table>
    <br/>
  `;

  // 2. Model Summary
  html += `
    <h4>Model Summary</h4>
    <table class="statify-table" style="width: 100%; border-collapse: collapse; text-align: right;">
      <thead>
        <tr style="border-bottom: 2px solid black; border-top: 2px solid black;">
          <th style="text-align: left; padding: 5px;">Step</th>
          <th style="padding: 5px;">-2 Log likelihood</th>
          <th style="padding: 5px;">Cox & Snell R Square</th>
          <th style="padding: 5px;">Nagelkerke R Square</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: left; padding: 5px;">1</td>
          <td style="padding: 5px;">${fmt(
            result.model_summary.log_likelihood
          )}</td>
          <td style="padding: 5px;">${fmt(
            result.model_summary.cox_snell_r2
          )}</td>
          <td style="padding: 5px;">${fmt(
            result.model_summary.nagelkerke_r2
          )}</td>
        </tr>
      </tbody>
      <tfoot style="border-top: 2px solid black;"></tfoot>
    </table>
    <br/>
  `;

  // 3. Classification Table
  const ct = result.classification_table;
  html += `
    <h4>Classification Table</h4>
    <table class="statify-table" style="width: 100%; border-collapse: collapse; text-align: right;">
      <thead>
        <tr style="border-top: 2px solid black;">
          <th colspan="2" rowspan="2" style="text-align: left; border-bottom: 1px solid black;">Observed</th>
          <th colspan="3" style="text-align: center; border-bottom: 1px solid black;">Predicted</th>
        </tr>
        <tr style="border-bottom: 2px solid black;">
          <th colspan="2" style="text-align: center;">${dependentName}</th>
          <th style="padding: 5px;">Percentage Correct</th>
        </tr>
      </thead>
      <tbody>
        <tr>
           <td rowspan="2" style="text-align: left; vertical-align: middle;">${dependentName}</td>
           <td style="text-align: left; padding: 5px;">0</td>
           <td style="padding: 5px;">${ct.predicted_0_observed_0}</td>
           <td style="padding: 5px;">${ct.predicted_1_observed_0}</td>
           <td style="padding: 5px;">${fmt(
             (ct.predicted_0_observed_0 /
               (ct.predicted_0_observed_0 + ct.predicted_1_observed_0)) *
               100,
             1
           )}</td>
        </tr>
        <tr>
           <td style="text-align: left; padding: 5px;">1</td>
           <td style="padding: 5px;">${ct.predicted_0_observed_1}</td>
           <td style="padding: 5px;">${ct.predicted_1_observed_1}</td>
           <td style="padding: 5px;">${fmt(
             (ct.predicted_1_observed_1 /
               (ct.predicted_0_observed_1 + ct.predicted_1_observed_1)) *
               100,
             1
           )}</td>
        </tr>
        <tr style="border-top: 1px solid black;">
           <td colspan="2" style="text-align: left; padding: 5px;">Overall Percentage</td>
           <td></td>
           <td></td>
           <td style="padding: 5px;">${fmt(ct.overall_percentage, 1)}</td>
        </tr>
      </tbody>
      <tfoot style="border-top: 2px solid black;"></tfoot>
    </table>
    <br/>
  `;

  // 4. Variables in the Equation
  html += `
    <h4>Variables in the Equation</h4>
    <table class="statify-table" style="width: 100%; border-collapse: collapse; text-align: right;">
      <thead>
        <tr style="border-bottom: 2px solid black; border-top: 2px solid black;">
          <th style="text-align: left; padding: 5px;"></th>
          <th style="padding: 5px;">B</th>
          <th style="padding: 5px;">S.E.</th>
          <th style="padding: 5px;">Wald</th>
          <th style="padding: 5px;">df</th>
          <th style="padding: 5px;">Sig.</th>
          <th style="padding: 5px;">Exp(B)</th>
        </tr>
      </thead>
      <tbody>
  `;

  result.variables_in_equation.forEach((row) => {
    html += `
        <tr>
          <td style="text-align: left; padding: 5px;">${row.label}</td>
          <td style="padding: 5px;">${fmt(row.b)}</td>
          <td style="padding: 5px;">${fmt(row.se)}</td>
          <td style="padding: 5px;">${fmt(row.wald)}</td>
          <td style="padding: 5px;">${row.df}</td>
          <td style="padding: 5px;">${fmtSig(row.sig)}</td>
          <td style="padding: 5px;">${fmt(row.exp_b)}</td>
        </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot style="border-top: 2px solid black;"></tfoot>
    </table>
  </div>`;

  return html;
};
