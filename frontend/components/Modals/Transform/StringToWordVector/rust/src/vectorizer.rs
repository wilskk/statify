use crate::error::AppError;
use serde::Serialize;
use std::collections::{BTreeSet, HashMap, HashSet};

/// Struct output final yang dikirim ke JavaScript.
#[derive(Serialize)]
pub struct VectorizerOutput {
    pub vocabulary: Vec<String>,
    pub matrix: Vec<Vec<f64>>,
    pub stats: OutputStats,
}

#[derive(Serialize)]
pub struct OutputStats {
    pub total_documents: usize,
    pub vocabulary_size: usize,
    pub method: String,
}

/// Vectorizer: mengubah koleksi token per dokumen menjadi matriks angka.
///
/// Formula yang digunakan (kompatibel sklearn):
/// - Binary    : 1.0 jika term ada, 0.0 jika tidak
/// - wordCount : count(t, d) — frekuensi mentah
/// - tf        : count(t, d) / total_terms(d) — frekuensi relatif
/// - tfidf     : TF(t,d) × IDF(t), dengan IDF = log((1+N)/(1+df)) + 1 (sklearn smooth)
///               Dilanjutkan dengan L2 normalization per baris agar kompatibel sklearn.
pub fn vectorize(
    processed: Vec<Vec<String>>,
    tf_method: &str,
    idf_method: &str,
) -> Result<VectorizerOutput, AppError> {
    // 1. Bangun vocabulary (BTreeSet → sudah sorted A-Z, hasil deterministik)
    let mut vocab_set: BTreeSet<String> = BTreeSet::new();
    for doc_tokens in &processed {
        for token in doc_tokens {
            vocab_set.insert(token.clone());
        }
    }
    let vocabulary: Vec<String> = vocab_set.into_iter().collect();

    if vocabulary.is_empty() {
        return Err(AppError::new(
            "EMPTY_VOCABULARY",
            "Vocabulary kosong setelah preprocessing. Coba kurangi stopwords atau ubah konfigurasi stemming.",
        ));
    }

    // Index vocabulary untuk lookup O(1)
    let vocab_index: HashMap<&str, usize> = vocabulary
        .iter()
        .enumerate()
        .map(|(i, t)| (t.as_str(), i))
        .collect();

    let n = processed.len();
    let v = vocabulary.len();

    // 2. Hitung Document Frequency (df[i] = jumlah dokumen yang mengandung term i)
    let mut df = vec![0.0_f64; v];
    for doc_tokens in &processed {
        let doc_set: HashSet<&str> = doc_tokens.iter().map(|s| s.as_str()).collect();
        for (i, term) in vocabulary.iter().enumerate() {
            if doc_set.contains(term.as_str()) {
                df[i] += 1.0;
            }
        }
    }

    // 3. Hitung IDF berdasarkan idf_method
    let mut idf = vec![1.0_f64; v];
    if idf_method != "none" {
        for (i, &d) in df.iter().enumerate() {
            idf[i] = match idf_method {
                "idf" => (n as f64 / d).ln(),
                "smooth" => ((1.0 + n as f64) / (1.0 + d)).ln() + 1.0,
                _ => 1.0,
            };
        }
    }

    // 4. Bangun matriks (baris = dokumen, kolom = term di vocabulary)
    let mut matrix: Vec<Vec<f64>> = Vec::with_capacity(n);

    for doc_tokens in &processed {
        let mut row = vec![0.0_f64; v];
        let total = doc_tokens.len() as f64;

        // Hitung term count per dokumen dalam satu pass
        let mut counts: HashMap<&str, f64> = HashMap::new();
        for token in doc_tokens {
            *counts.entry(token.as_str()).or_insert(0.0) += 1.0;
        }

        for (term, &idx) in &vocab_index {
            let count = *counts.get(term).unwrap_or(&0.0);
            
            let tf = match tf_method {
                "none" | "binary" => if count > 0.0 { 1.0 } else { 0.0 },
                "raw" => count,
                "normalized" => if total > 0.0 { count / total } else { 0.0 },
                "log" => if count > 0.0 { 1.0 + count.ln() } else { 0.0 },
                _ => count, // default raw
            };

            row[idx] = tf * idf[idx];
        }

        matrix.push(row);
    }

    Ok(VectorizerOutput {
        stats: OutputStats {
            total_documents: n,
            vocabulary_size: v,
            method: format!("TF: {}, IDF: {}", tf_method, idf_method),
        },
        vocabulary,
        matrix,
    })
}
