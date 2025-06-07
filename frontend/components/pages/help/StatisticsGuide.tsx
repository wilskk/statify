import React from "react";

interface StatisticsGuideProps {
  section?: string; // Optional prop to control which section to display
}

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({ section }) => {
  // If section is specified, only show that section
  const showFrequencies = !section || section === "frequencies";
  const showDescriptives = !section || section === "descriptives";
  
  return (
    <div className="space-y-6">
      {/* Always show the intro section unless we're showing a specific child section */}
      {!section && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Statistical Analysis in Statify</h3>
          <p>
            Statify provides powerful statistical analysis tools to help you understand and interpret your data.
            This guide covers the different statistical methods available, starting with frequency analysis.
          </p>
        </div>
      )}

      {/* Render the Frequencies section conditionally */}
      {showFrequencies && (
        <div id="frequencies" className="mt-6 space-y-4 border-l-4 pl-4 border-primary">
          <h3 className="text-lg font-medium">Frequencies Analysis</h3>
          <p>
            Frequencies analysis helps you understand the distribution of values within your variables.
            It counts occurrences of each unique value and presents them as both raw counts and percentages.
          </p>

          <div className="mt-4 space-y-3">
            <h4 className="text-base font-medium">When to Use Frequencies Analysis</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>To examine the distribution of categorical variables (gender, region, product type)</li>
              <li>To check data quality and identify unusual values</li>
              <li>To understand the prevalence of different responses in survey data</li>
              <li>To identify patterns and outliers in your dataset</li>
            </ul>

            <h4 className="text-base font-medium mt-4">Using Frequencies Analysis</h4>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Navigate to <b>Analyze &gt; Descriptive Statistics &gt; Frequencies</b></li>
              <li>Move one or more variables from the "Available Variables" list to the "Variable(s)" list</li>
              <li>Optionally, navigate to the Statistics tab to select additional statistics to display</li>
              <li>Click <b>OK</b> to run the analysis</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <h5 className="font-medium text-blue-800">Example Use Case</h5>
              <p className="text-blue-700 text-sm">
                A market researcher analyzes survey responses about customer satisfaction ratings (1-5) using frequencies.
                The analysis shows 60% of customers gave ratings of 4 or 5, indicating high satisfaction overall.
              </p>
            </div>
            
            <h4 className="text-base font-medium mt-4">Available Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="border-l-[3px] border-blue-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Frequency Tables</h5>
                <p className="text-sm text-gray-600">
                  Display tables showing counts, percentages, valid percentages (excluding missing values),
                  and cumulative percentages for each value
                </p>
              </div>
              
              <div className="border-l-[3px] border-green-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Charts</h5>
                <p className="text-sm text-gray-600">
                  Choose from bar charts, pie charts, or histograms (with optional normal curve)
                  to visualize your data distribution
                </p>
              </div>
              
              <div className="border-l-[3px] border-purple-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Statistics</h5>
                <p className="text-sm text-gray-600">
                  Calculate descriptive statistics to summarize your data numerically
                </p>
              </div>
              
              <div className="border-l-[3px] border-amber-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Percentiles</h5>
                <p className="text-sm text-gray-600">
                  Calculate quartiles (25%, 50%, 75%), equal-sized groups (deciles, quintiles), 
                  or custom percentile values
                </p>
              </div>
            </div>
            
            <h4 className="text-base font-medium mt-4">Formulas Used in Frequency Analysis</h4>
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-100">
              <p className="text-sm">
                Frequencies analysis uses the following calculations to generate statistics:
              </p>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Frequency Count</p>
                <p>The number of occurrences of each unique value in the variable</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Percent</p>
                <p>Percentage of total observations represented by each value:</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Percent = (Frequency ÷ Total N) × 100
                </div>
                <p className="text-xs text-gray-500">Where Total N is the count of all observations including missing values</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Valid Percent</p>
                <p>Percentage calculated after excluding missing values:</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Valid Percent = (Frequency ÷ Valid N) × 100
                </div>
                <p className="text-xs text-gray-500">Where Valid N is the count of non-missing observations only</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Cumulative Percent</p>
                <p>Running sum of valid percentages:</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Cumulative Percent<sub>i</sub> = Valid Percent<sub>i</sub> + Cumulative Percent<sub>i-1</sub>
                </div>
                <p className="text-xs text-gray-500">Where i represents the current row and i-1 is the previous row</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Missing Data Handling</p>
                <p>Statify distinguishes between two types of missing data:</p>
                <ul className="list-disc ml-5">
                  <li><b>System Missing</b> - Empty values or invalid entries (e.g., blank cells)</li>
                  <li><b>User-Defined Missing</b> - Specific values designated as missing (e.g., -999, "N/A")</li>
                </ul>
                <p>Both types are excluded from valid percentage calculations but included in the total count.</p>
              </div>
            </div>
            
            <h4 className="text-base font-medium mt-4">Statistics Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="font-medium text-sm">Central Tendency</p>
                <ul className="list-disc ml-5 text-sm text-gray-600">
                  <li><b>Mean</b> - arithmetic average of all values</li>
                  <li><b>Median</b> - middle value when ordered</li>
                  <li><b>Mode</b> - most frequently occurring value</li>
                  <li><b>Sum</b> - total of all values</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-sm">Dispersion</p>
                <ul className="list-disc ml-5 text-sm text-gray-600">
                  <li><b>Standard deviation</b> - measure of spread around the mean</li>
                  <li><b>Variance</b> - average of squared differences from the mean</li>
                  <li><b>Range</b> - difference between highest and lowest values</li>
                  <li><b>Minimum/Maximum</b> - smallest and largest values</li>
                  <li><b>Standard error of mean</b> - estimate of mean&apos;s sampling variability</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-sm">Distribution</p>
                <ul className="list-disc ml-5 text-sm text-gray-600">
                  <li><b>Skewness</b> - measure of asymmetry (positive = right tail, negative = left tail)</li>
                  <li><b>Kurtosis</b> - measure of &quot;tailedness&quot; compared to normal distribution</li>
                </ul>
              </div>
            </div>
            
            <h4 className="text-base font-medium mt-4">Interpreting Frequency Tables</h4>
            <p className="text-sm">
              Frequency tables contain several columns:
            </p>
            <ul className="list-disc ml-5 text-sm text-gray-600">
              <li><b>Frequency</b> - count of occurrences for each value</li>
              <li><b>Percent</b> - percentage of total cases (including missing values)</li>
              <li><b>Valid Percent</b> - percentage excluding missing values</li>
              <li><b>Cumulative Percent</b> - running total of valid percentages</li>
            </ul>
            
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md mt-4">
              <p className="text-amber-800 text-sm">
                <span className="font-medium">Tip:</span> For continuous variables with many unique values, consider using histograms
                rather than frequency tables, which might become excessively long. You can also bin continuous 
                data into categories using the &quot;Transform &gt; Visual Binning&quot; function before running frequencies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Render the Descriptives section conditionally */}
      {showDescriptives && (
        <div id="descriptives" className="mt-8 space-y-4 border-l-4 pl-4 border-emerald-500">
          <h3 className="text-lg font-medium">Descriptive Statistics</h3>
          <p>
            Descriptive Statistics provides a comprehensive summary of the central tendency, dispersion, and 
            distribution of your numeric variables. While Frequencies can be used for all variable types, Descriptives
            is optimized for working with continuous variables.
          </p>

          <div className="mt-4 space-y-3">
            <h4 className="text-base font-medium">When to Use Descriptive Statistics</h4>
            <ul className="list-disc ml-5 space-y-1">
              <li>To calculate summary measures for continuous variables (age, income, test scores)</li>
              <li>To compare statistical characteristics across multiple variables</li>
              <li>To detect outliers and understand data distribution</li>
              <li>To generate standardized scores (Z-scores) for your variables</li>
            </ul>

            <h4 className="text-base font-medium mt-4">Using Descriptive Statistics</h4>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Navigate to <b>Analyze &gt; Descriptive Statistics &gt; Descriptives</b></li>
              <li>Select one or more numeric variables from the available list</li>
              <li>Choose which statistics to display in the Statistics tab</li>
              <li>Optionally, check &quot;Save standardized values as variables&quot; to create Z-score variables</li>
              <li>Click <b>OK</b> to run the analysis</li>
            </ol>
            
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-md">
              <h5 className="font-medium text-emerald-800">Example Use Case</h5>
              <p className="text-emerald-700 text-sm">
                A researcher compares test scores across different subjects. The descriptive statistics
                show that mathematics has the highest mean (75.2) but also the largest standard deviation (15.3),
                indicating greater variability than other subjects.
              </p>
            </div>
            
            <h4 className="text-base font-medium mt-4">Available Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="border-l-[3px] border-emerald-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Statistics Selection</h5>
                <p className="text-sm text-gray-600">
                  Choose which statistics to display: mean, sum, standard deviation, variance,
                  range, minimum, maximum, standard error, and more
                </p>
              </div>
              
              <div className="border-l-[3px] border-indigo-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Display Order</h5>
                <p className="text-sm text-gray-600">
                  Control how variables are ordered in results: variable list order, alphabetically,
                  or by ascending or descending means
                </p>
              </div>
              
              <div className="border-l-[3px] border-amber-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Z-Score Creation</h5>
                <p className="text-sm text-gray-600">
                  Generate standardized (Z-score) variables that show how many standard
                  deviations each value is from the mean
                </p>
              </div>
              
              <div className="border-l-[3px] border-violet-500 pl-3 py-1">
                <h5 className="font-medium text-sm">Distribution Analysis</h5>
                <p className="text-sm text-gray-600">
                  Calculate skewness and kurtosis to understand the shape and symmetry
                  of your data distribution
                </p>
              </div>
            </div>
            
            <h4 className="text-base font-medium mt-4">Key Formulas in Descriptive Statistics</h4>
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-100">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Mean (Arithmetic Average)</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Mean (μ) = ∑X / n
                </div>
                <p className="text-xs text-gray-500">Where ∑X is the sum of all values and n is the number of observations</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Standard Deviation</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Std. Deviation (σ) = √Variance = √[∑(X - μ)² / n]
                </div>
                <p className="text-xs text-gray-500">Measures the average distance of data points from the mean</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Variance</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Variance (σ²) = ∑(X - μ)² / n
                </div>
                <p className="text-xs text-gray-500">Measures the average squared distance from the mean</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Standard Error of the Mean</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  S.E. Mean = σ / √n
                </div>
                <p className="text-xs text-gray-500">Estimates how much the sample mean may differ from the population mean</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Z-Score (Standardized Value)</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Z = (X - μ) / σ
                </div>
                <p className="text-xs text-gray-500">Converts a raw score to a standardized score, showing how many standard deviations a value is from the mean</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Skewness</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Skewness = ∑(X - μ)³ / (n × σ³)
                </div>
                <p className="text-xs text-gray-500">Measures the asymmetry of the probability distribution; positive values indicate right skew, negative values indicate left skew</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Kurtosis</p>
                <div className="p-2 bg-white text-center rounded border border-gray-200">
                  Kurtosis = [∑(X - μ)⁴ / (n × σ⁴)] - 3
                </div>
                <p className="text-xs text-gray-500">Measures the &quot;tailedness&quot; of the distribution; positive values indicate heavier tails than normal distribution (leptokurtic)</p>
              </div>
            </div>
            
            <h4 className="text-base font-medium mt-4">Understanding Z-Scores</h4>
            <p className="text-sm">
              Z-scores convert your original values into standardized units, showing how many standard deviations
              each value is from the mean. This allows for comparing values from different variables on the same scale.
            </p>
            <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
              <li>Z = 0: The value equals the mean</li>
              <li>Z = 1: The value is one standard deviation above the mean</li>
              <li>Z = -1: The value is one standard deviation below the mean</li>
              <li>In a normal distribution, about 68% of values fall between Z = -1 and Z = 1</li>
              <li>Z-scores beyond ±3 often indicate potential outliers</li>
            </ul>
            
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md mt-4">
              <p className="text-amber-800 text-sm">
                <span className="font-medium">Tip:</span> When creating Z-scores, Statify adds new variables to your dataset with 
                names starting with &quot;Z&quot; followed by the original variable name (e.g., ZAge for the standardized version of Age).
                These variables maintain the same relationships between values while making them directly comparable across different scales.
              </p>
            </div>
            
            <h4 className="text-base font-medium mt-4">Interpreting Results</h4>
            <p className="text-sm">
              The Descriptives output table presents statistics in columns for each selected variable:
            </p>
            <ul className="list-disc ml-5 text-sm text-gray-600">
              <li><b>N</b> - Number of valid cases (non-missing values)</li>
              <li><b>Mean</b> - Arithmetic average of the variable</li>
              <li><b>Std. Deviation</b> - Spread of values around the mean</li>
              <li><b>Minimum/Maximum</b> - Smallest and largest values</li>
              <li><b>Range</b> - Difference between maximum and minimum values</li>
              <li><b>Valid N (listwise)</b> - Number of cases with valid values for all selected variables</li>
            </ul>
            
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md mt-4">
              <h5 className="font-medium text-blue-800">Choosing Between Frequencies and Descriptives</h5>
              <p className="text-blue-700 text-sm">
                Use <b>Frequencies</b> when you want to see the distribution of individual values and count occurrences, 
                especially for categorical variables or variables with few unique values. Use <b>Descriptives</b> when 
                you want a statistical summary of continuous variables or need to create standardized scores.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsGuide; 