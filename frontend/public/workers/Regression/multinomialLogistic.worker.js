// [EDIT: Sesuaikan path impor ke file pkg hasil build wasm-pack Anda]
import init, { run_multinomial_analysis } from './pkg/statify_multinomial.js';

onmessage = async (e) => {
    try {
        await init(); // Inisialisasi modul WASM
        const { data, options } = e.data;

        // Panggil fungsi Rust yang kita ekspos di lib.rs
        const result = run_multinomial_analysis(data, options);

        postMessage({ type: 'SUCCESS', payload: result });
    } catch (error) {
        postMessage({ type: 'ERROR', error: error.message });
    }
};