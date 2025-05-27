// generate_plots.rs
use std::collections::HashMap;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, PlotData, PlotPoint, PlotSeries },
};

use super::core::{
    calculate_mean,
    calculate_std_deviation,
    calculate_t_critical,
    extract_numeric_from_record,
    get_factor_levels,
    data_value_to_string,
};

/// Generate plots based on configuration
pub fn generate_plots(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, PlotData>, String> {
    if config.plots.src_list.is_empty() {
        return Err("No source list specified for plots".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = HashMap::new();

    // Process each plot source
    for src in &config.plots.src_list {
        // Check if source is a single factor or interaction
        let factors: Vec<&str> = src
            .split('*')
            .map(|s| s.trim())
            .collect();

        if factors.len() == 1 {
            // One-way plot
            let factor = factors[0];
            let factor_levels = get_factor_levels(data, factor)?;

            let mut points = Vec::new();
            let mut error_bars = Vec::new();

            for level in &factor_levels {
                // Extract values for this level
                let mut values = Vec::new();

                for records in &data.dependent_data {
                    for record in records {
                        let record_level = record.values.get(factor).map(data_value_to_string);

                        if record_level.as_deref() == Some(level) {
                            if let Some(value) = extract_numeric_from_record(record, &dep_var_name) {
                                values.push(value);
                            }
                        }
                    }
                }

                if values.is_empty() {
                    continue;
                }

                // Calculate mean and standard error
                let mean = calculate_mean(&values);
                let std_deviation = calculate_std_deviation(&values, Some(mean));
                let std_error = std_deviation / (values.len() as f64).sqrt();

                // Add point
                points.push(PlotPoint {
                    x: factor_levels
                        .iter()
                        .position(|l| l == level)
                        .unwrap() as f64,
                    y: mean,
                    label: level.clone(),
                });

                // Add error bar if requested
                if config.plots.include_error_bars {
                    let multiplier = config.plots.multiplier as f64;

                    if config.plots.confidence_interval {
                        // Use confidence interval
                        let df = values.len() - 1;
                        let t_critical = calculate_t_critical(
                            Some(config.options.sig_level / 2.0),
                            df
                        );
                        let ci_width = std_error * t_critical;

                        error_bars.push(ConfidenceInterval {
                            lower_bound: mean - ci_width,
                            upper_bound: mean + ci_width,
                        });
                    } else if config.plots.standard_error {
                        // Use standard error
                        error_bars.push(ConfidenceInterval {
                            lower_bound: mean - multiplier * std_error,
                            upper_bound: mean + multiplier * std_error,
                        });
                    }
                }
            }

            // Create plot data
            let mut plot_data = PlotData {
                title: format!("Mean of {} for levels of {}", dep_var_name, factor),
                x_label: factor.to_string(),
                y_label: dep_var_name.clone(),
                series: vec![PlotSeries {
                    name: dep_var_name.clone(),
                    points,
                    error_bars: if config.plots.include_error_bars {
                        Some(error_bars)
                    } else {
                        None
                    },
                    series_type: if config.plots.line_chart_type {
                        "line".to_string()
                    } else {
                        "bar".to_string()
                    },
                }],
                y_axis_starts_at_zero: config.plots.y_axis_start_0,
                includes_reference_line: config.plots.include_ref_line_for_grand_mean,
                reference_line: None,
            };

            // Add grand mean reference line if requested
            if config.plots.include_ref_line_for_grand_mean {
                // Calculate grand mean across all data
                let mut all_values = Vec::new();

                for records in &data.dependent_data {
                    for record in records {
                        if let Some(value) = extract_numeric_from_record(record, &dep_var_name) {
                            all_values.push(value);
                        }
                    }
                }

                if !all_values.is_empty() {
                    plot_data.reference_line = Some(calculate_mean(&all_values));
                }
            }

            result.insert(src.clone(), plot_data);
        } else if factors.len() == 2 {
            // Two-way plot (interaction)
            let factor1 = factors[0];
            let factor2 = factors[1];

            let factor1_levels = get_factor_levels(data, factor1)?;
            let factor2_levels = get_factor_levels(data, factor2)?;

            let mut series = Vec::new();

            // Create a series for each level of factor2
            for f2_level in &factor2_levels {
                let mut points = Vec::new();
                let mut error_bars = Vec::new();

                // For each level of factor1
                for (x_idx, f1_level) in factor1_levels.iter().enumerate() {
                    // Extract values for this combination
                    let mut values = Vec::new();

                    for records in &data.dependent_data {
                        for record in records {
                            let f1_match =
                                record.values.get(factor1).map(data_value_to_string).as_deref() ==
                                Some(f1_level);

                            let f2_match =
                                record.values.get(factor2).map(data_value_to_string).as_deref() ==
                                Some(f2_level);

                            if f1_match && f2_match {
                                if
                                    let Some(value) = extract_numeric_from_record(
                                        record,
                                        &dep_var_name
                                    )
                                {
                                    values.push(value);
                                }
                            }
                        }
                    }

                    if values.is_empty() {
                        continue;
                    }

                    // Calculate mean and standard error
                    let mean = calculate_mean(&values);
                    let std_deviation = calculate_std_deviation(&values, Some(mean));
                    let std_error = std_deviation / (values.len() as f64).sqrt();

                    // Add point
                    points.push(PlotPoint {
                        x: x_idx as f64,
                        y: mean,
                        label: f1_level.clone(),
                    });

                    // Add error bar if requested
                    if config.plots.include_error_bars {
                        let multiplier = config.plots.multiplier as f64;

                        if config.plots.confidence_interval {
                            // Use confidence interval
                            let df = values.len() - 1;
                            let t_critical = calculate_t_critical(
                                Some(config.options.sig_level / 2.0),
                                df
                            );
                            let ci_width = std_error * t_critical;

                            error_bars.push(ConfidenceInterval {
                                lower_bound: mean - ci_width,
                                upper_bound: mean + ci_width,
                            });
                        } else if config.plots.standard_error {
                            // Use standard error
                            error_bars.push(ConfidenceInterval {
                                lower_bound: mean - multiplier * std_error,
                                upper_bound: mean + multiplier * std_error,
                            });
                        }
                    }
                }

                // Add series for this level of factor2
                series.push(PlotSeries {
                    name: format!("{}={}", factor2, f2_level),
                    points,
                    error_bars: if config.plots.include_error_bars {
                        Some(error_bars)
                    } else {
                        None
                    },
                    series_type: if config.plots.line_chart_type {
                        "line".to_string()
                    } else {
                        "bar".to_string()
                    },
                });
            }

            // Create plot data
            let plot_data = PlotData {
                title: format!("Mean of {} for {} * {}", dep_var_name, factor1, factor2),
                x_label: factor1.to_string(),
                y_label: dep_var_name.clone(),
                series,
                y_axis_starts_at_zero: config.plots.y_axis_start_0,
                includes_reference_line: false,
                reference_line: None,
            };

            result.insert(src.clone(), plot_data);
        }
    }

    Ok(result)
}
