// use crate::models::result::{FactorAnalysisResult, LoadingPlot, LoadingPoint};

// pub fn generate_loading_plots(
//     result: &FactorAnalysisResult,
// ) -> Result<LoadingPlot, String> {

//     // 1. Pilih Matriks (Prioritas: Pattern > Rotated > Component)
//     let (components_map, variable_order) = if let Some(pattern) = &result.pattern_matrix {
//         (&pattern.components, &pattern.variable_order)
//     } else if let Some(rotated) = &result.rotated_component_matrix {
//         (&rotated.components, &rotated.variable_order)
//     } else if let Some(component) = &result.component_matrix {
//         (&component.components, &component.variable_order)
//     } else {
//         return Err("No matrix available for loading plot".to_string());
//     };

//     // 2. Cek Jumlah Komponen
//     let first_var = variable_order.first()
//         .ok_or("No variables found".to_string())?;
    
//     let num_components = components_map.get(first_var)
//         .map(|v| v.len())
//         .unwrap_or(0);

//     if num_components < 2 {
//         return Err("Min 2 components required for plot".to_string());
//     }

//     // 3. Buat Label Sumbu
//     let axis_labels: Vec<String> = (1..=num_components)
//         .map(|i| format!("Component {}", i))
//         .collect();

//     // 4. Ambil Koordinat
//     let mut points: Vec<LoadingPoint> = Vec::new();

//     for var_name in variable_order {
//         if let Some(loadings) = components_map.get(var_name) {
//             // Kita ambil sejumlah num_components saja untuk keamanan
//             if loadings.len() >= num_components {
//                 points.push(LoadingPoint {
//                     label: var_name.clone(),
//                     coordinates: loadings[0..num_components].to_vec(),
//                 });
//             }
//         }
//     }

//     Ok(LoadingPlot {
//         axis_labels,
//         points,
//     })
// }







// perbaikan 4/2/2026
use crate::models::result::{FactorAnalysisResult, LoadingPlot, LoadingPoint};

pub fn generate_loading_plots(
    result: &FactorAnalysisResult,
) -> Result<LoadingPlot, String> {

    // 1. Pilih Matriks (Prioritas: Pattern > Rotated > Component)
    let (components_map, variable_order) = if let Some(pattern) = &result.pattern_matrix {
        (&pattern.components, &pattern.variable_order)
    } else if let Some(rotated) = &result.rotated_component_matrix {
        (&rotated.components, &rotated.variable_order)
    } else if let Some(component) = &result.component_matrix {
        (&component.components, &component.variable_order)
    } else {
        return Err("No matrix available for loading plot".to_string());
    };

    // 2. Cek Jumlah Komponen
    let first_var = variable_order.first()
        .ok_or("No variables found".to_string())?;
    
    let num_components = components_map.get(first_var)
        .map(|v| v.len())
        .unwrap_or(0);

    if num_components < 2 {
        return Err("Min 2 components required for plot".to_string());
    }

    // 3. Buat Label Sumbu
    let axis_labels: Vec<String> = (1..=num_components)
        .map(|i| format!("Component {}", i))
        .collect();

    // 4. Ambil Koordinat & DETEKSI CROSS LOADING
    let mut points: Vec<LoadingPoint> = Vec::new();
    let mut global_issue_detected = false;

    for var_name in variable_order {
        if let Some(loadings) = components_map.get(var_name) {
            // Kita ambil semua loadings yang tersedia untuk perhitungan cross loading
            // meskipun visualisasi mungkin hanya 2D/3D
            let full_loadings = loadings.clone();
            
            // --- ALGORITMA CROSS LOADING DETECTION ---
            let mut is_cross_loading = false;
            let mut gap = 0.0;

            if full_loadings.len() >= 2 {
                // 1. Ambil nilai absolut
                let mut abs_loadings: Vec<f64> = full_loadings.iter().map(|v| v.abs()).collect();
                
                // 2. Sorting Descending
                abs_loadings.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

                let primary = abs_loadings[0];
                let secondary = abs_loadings[1];

                // 3. Hitung Gap
                gap = primary - secondary;

                // 4. Rule: Primary signifikan (>0.32) DAN Gap terlalu tipis (<0.20)
                // Howard (2016) & Hair et al. (2010)
                if primary > 0.32 && gap < 0.20 {
                    is_cross_loading = true;
                    global_issue_detected = true;
                }
            }
            // -----------------------------------------

            // Batasi koordinat sesuai visualisasi (misal 3 dimensi max untuk plot)
            let plot_coords = if loadings.len() >= num_components {
                loadings[0..num_components].to_vec()
            } else {
                loadings.clone()
            };

            points.push(LoadingPoint {
                label: var_name.clone(),
                coordinates: plot_coords,
                is_cross_loading,
                loading_gap: gap,
            });
        }
    }

    Ok(LoadingPlot {
        axis_labels,
        points,
        has_cross_loading_issues: global_issue_detected,
    })
}