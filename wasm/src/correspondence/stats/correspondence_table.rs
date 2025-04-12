use crate::correspondence::models::{
    config::CorrespondenceAnalysisConfig,
    data::{ AnalysisData, DataValue },
    result::CorrespondenceTable,
};

use super::core::{ filter_active_categories, get_unique_categories, apply_equality_constraints };

// Create correspondence table from the input data and configuration
pub fn create_correspondence_table(
    data: &AnalysisData,
    config: &CorrespondenceAnalysisConfig
) -> Result<CorrespondenceTable, String> {
    // Extract row and column variables from configuration
    let row_var = config.main.row_target_var.as_ref().ok_or("Row target variable not specified")?;
    let col_var = config.main.col_target_var
        .as_ref()
        .ok_or("Column target variable not specified")?;

    // Collect all unique row and column values from the data
    let mut all_row_records = Vec::new();
    for dataset in &data.row_data {
        for record in dataset {
            if record.values.contains_key(row_var) {
                all_row_records.push(record.clone());
            }
        }
    }

    let mut all_col_records = Vec::new();
    for dataset in &data.col_data {
        for record in dataset {
            if record.values.contains_key(col_var) {
                all_col_records.push(record.clone());
            }
        }
    }

    // Get unique categories
    let row_categories = get_unique_categories(&all_row_records, row_var)?;
    let col_categories = get_unique_categories(&all_col_records, col_var)?;

    // Filter active categories based on configuration
    let active_row_cats = filter_active_categories(&row_categories, &config.define_range_row)?;
    let active_col_cats = filter_active_categories(&col_categories, &config.define_range_column)?;

    // Create correspondence table matrix
    let mut table_data: Vec<Vec<f64>> =
        vec![vec![0.0; active_col_cats.len()]; active_row_cats.len()];
    let mut active_margin_row: Vec<f64> = vec![0.0; active_row_cats.len()];
    let mut active_margin_col: Vec<f64> = vec![0.0; active_col_cats.len()];

    // Process each dataset pair
    let min_datasets = std::cmp::min(data.row_data.len(), data.col_data.len());

    for dataset_idx in 0..min_datasets {
        let row_dataset = &data.row_data[dataset_idx];
        let col_dataset = &data.col_data[dataset_idx];

        // Match records by index within each dataset
        let min_records = std::cmp::min(row_dataset.len(), col_dataset.len());

        for record_idx in 0..min_records {
            let row_record = &row_dataset[record_idx];
            let col_record = &col_dataset[record_idx];

            // Extract row value
            let row_value = match row_record.values.get(row_var) {
                Some(DataValue::Text(s)) => s.clone(),
                Some(DataValue::Number(n)) => n.to_string(),
                _ => {
                    continue;
                }
            };

            // Extract column value
            let col_value = match col_record.values.get(col_var) {
                Some(DataValue::Text(s)) => s.clone(),
                Some(DataValue::Number(n)) => n.to_string(),
                _ => {
                    continue;
                }
            };

            // Find indices in active categories
            if
                let (Some(row_idx), Some(col_idx)) = (
                    active_row_cats.iter().position(|c| c == &row_value),
                    active_col_cats.iter().position(|c| c == &col_value),
                )
            {
                table_data[row_idx][col_idx] += 1.0;
                active_margin_row[row_idx] += 1.0;
                active_margin_col[col_idx] += 1.0;
            }
        }
    }

    // Apply equality constraints if specified
    apply_equality_constraints(
        &mut table_data,
        &mut active_margin_row,
        &mut active_margin_col,
        config
    )?;

    // Debug output
    println!("Created correspondence table of size {}x{}", table_data.len(), if
        table_data.is_empty()
    {
        0
    } else {
        table_data[0].len()
    });

    Ok(CorrespondenceTable {
        data: table_data,
        active_margin: active_margin_row,
    })
}
