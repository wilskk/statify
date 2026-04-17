// Node.js test for K-Medoids WASM module
const fs = require('fs');
const path = require('path');

async function testKMedoids() {
    try {
        console.log('Loading WASM module...');
        
        // Load the WASM module
        const wasmPath = path.join(__dirname, 'pkg', 'wasm_bg.wasm');
        const wasmBuffer = fs.readFileSync(wasmPath);
        
        // Import the JavaScript wrapper
        const { run_k_medoids, test_connection } = require('./pkg/wasm.js');
        
        // Initialize WASM
        const wasmModule = await WebAssembly.instantiate(wasmBuffer);
        
        console.log('✓ WASM module loaded\n');
        
        // Test connection
        console.log('Testing connection...');
        const connectionResult = test_connection();
        console.log('Connection:', connectionResult);
        console.log('');
        
        // Prepare test data
        console.log('Preparing test data...');
        const testData = {
            data: [
                [1.0, 2.0],
                [1.5, 1.8],
                [5.0, 8.0],
                [8.0, 8.0],
                [1.0, 0.6],
                [9.0, 11.0]
            ],
            n_clusters: 2,
            method: "PAM",
            max_iterations: 100,
            distance_metric: "euclidean",
            random_seed: null
        };
        
        console.log('Input:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('');
        
        // Run clustering
        console.log('Running K-Medoids clustering...');
        const result = run_k_medoids(testData);
        
        console.log('\n✓ Clustering completed!\n');
        console.log('Result:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testKMedoids();
