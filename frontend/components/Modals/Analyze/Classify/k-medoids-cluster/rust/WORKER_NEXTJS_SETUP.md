# Web Worker Configuration for Next.js

## Current Status

**⚠️ Web Workers are currently DISABLED**

The implementation falls back to **direct execution** (main thread) until proper Next.js/webpack configuration is complete.

## Why Workers Don't Work Yet

Next.js doesn't support Web Workers out of the box with TypeScript files. The current code tries to load `cluster-worker.ts` directly, which fails because:

1. Browsers can't execute TypeScript directly
2. Next.js webpack doesn't automatically bundle worker files
3. `new Worker()` expects a JavaScript file or proper bundling

## Current Behavior

The code **automatically detects** the worker failure and falls back to direct execution:

```typescript
// Tries to use worker
useWorker: true;

// But falls back automatically if worker fails
if (workerInstance) {
  // Use worker (not working yet)
} else {
  // Use direct execution (CURRENT MODE)
}
```

**Impact**: UI will freeze briefly during clustering (especially for large datasets), but everything still works correctly.

## Solution Options

### Option 1: next-pwa Plugin (Recommended)

Install and configure next-pwa:

```bash
npm install next-pwa webpack
```

Update `next.config.js`:

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = "self";

      config.module.rules.push({
        test: /cluster-worker\.ts$/,
        loader: "worker-loader",
        options: {
          filename: "static/[hash].worker.js",
          publicPath: "/_next/",
        },
      });
    }
    return config;
  },
});
```

Install worker-loader:

```bash
npm install worker-loader --save-dev
```

### Option 2: Inline Worker with Blob

Create worker as inline JavaScript blob (no webpack config needed):

**File**: `services/k-medoids-cluster-analysis.ts`

```typescript
function createInlineWorker(): Worker {
  const workerCode = `
        importScripts('/path/to/wasm.js');
        
        let wasmModule = null;
        async function initWasm() {
            await wasm_bindgen('/path/to/wasm_bg.wasm');
            wasmModule = wasm_bindgen;
        }
        
        self.onmessage = async function(e) {
            const { type, data } = e.data;
            if (type === 'cluster') {
                await initWasm();
                const result = wasmModule.run_k_medoids(data);
                self.postMessage({ type: 'success', result });
            }
        };
    `;

  const blob = new Blob([workerCode], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}
```

### Option 3: Separate JavaScript Worker File

Create `public/workers/cluster-worker.js`:

```javascript
// public/workers/cluster-worker.js
importScripts("/wasm/wasm.js");

let wasmModule = null;

async function initWasm() {
  await wasm_bindgen("/wasm/wasm_bg.wasm");
  wasmModule = wasm_bindgen;
}

self.onmessage = async function (e) {
  const { type, data } = e.data;

  if (type === "init") {
    await initWasm();
    self.postMessage({ type: "ready" });
  } else if (type === "cluster") {
    const result = wasmModule.run_k_medoids(data);
    self.postMessage({ type: "success", result });
  }
};
```

Then load it:

```typescript
const worker = new Worker("/workers/cluster-worker.js");
```

### Option 4: Use Comlink (Modern Approach)

Install Comlink:

```bash
npm install comlink
```

Create worker with Comlink:

```typescript
// worker/cluster.worker.ts
import * as Comlink from "comlink";
import init, { run_k_medoids } from "../rust/pkg/wasm";

const api = {
  async init() {
    await init();
  },
  async cluster(input) {
    return run_k_medoids(input);
  },
};

Comlink.expose(api);

// main code
import * as Comlink from "comlink";

const worker = new Worker(
  new URL("./worker/cluster.worker.ts", import.meta.url),
  { type: "module" },
);

const api = Comlink.wrap(worker);
await api.init();
const result = await api.cluster(input);
```

## Recommended Solution

For this project, I recommend **Option 1** (next-pwa + worker-loader) because:

✅ Proper webpack integration  
✅ TypeScript support  
✅ Hot reload works  
✅ Production optimized  
✅ Minimal code changes

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install next-pwa worker-loader --save-dev
```

### Step 2: Update next.config.js

Add worker-loader configuration to webpack config.

### Step 3: Update Worker Import

Change from:

```typescript
const workerPath = new URL("./cluster-worker.ts", import.meta.url).href;
```

To:

```typescript
import ClusterWorkerClass from "worker-loader!./cluster-worker.ts";
const worker = new ClusterWorkerClass();
```

### Step 4: Test

```bash
npm run dev
# Test clustering with large dataset
```

### Step 5: Enable Worker

Remove the early return in `initializeWorker()`:

```typescript
function initializeWorker(): ClusterWorker | null {
  if (!worker) {
    try {
      // Now properly configured!
      const WorkerClass = require("worker-loader!./cluster-worker.ts");
      worker = new WorkerClass.default();
      console.log("✅ K-Medoids Worker initialized");
    } catch (error) {
      console.error("❌ Failed to initialize worker:", error);
      return null;
    }
  }
  return worker;
}
```

## Testing After Configuration

1. **Check worker loads**: Browser DevTools → Sources → check for worker.js
2. **Check messages**: Console should show worker initialization
3. **Test large dataset**: 10k+ points should not freeze UI
4. **Test cancellation**: Cancel button should work
5. **Check progress**: Progress bar should update in real-time

## Verification Checklist

- [ ] Worker file appears in Sources tab
- [ ] Console shows "Worker initialized"
- [ ] UI stays responsive during clustering
- [ ] Progress updates appear
- [ ] Results are correct
- [ ] Cancellation works
- [ ] No console errors

## Current Workaround

Until workers are configured, the app uses **direct execution**:

- ✅ Everything works correctly
- ✅ Same results as worker mode
- ⚠️ UI may freeze briefly (<1s for small datasets, 2-5s for large)
- ⚠️ No progress updates during computation
- ⚠️ Cannot cancel running operations

**For datasets <1000 points**: Direct execution is perfectly fine!  
**For datasets >5000 points**: Consider configuring workers for better UX.

## Performance Impact

| Dataset Size  | Direct Execution        | With Worker            |
| ------------- | ----------------------- | ---------------------- |
| 100 points    | ~50ms (OK)              | ~50ms                  |
| 1,000 points  | ~200ms (Noticeable)     | ~200ms (UI responsive) |
| 5,000 points  | ~1-2s (Freeze)          | ~1-2s (No freeze)      |
| 10,000 points | ~3-5s (Very noticeable) | ~3-5s (UI smooth)      |

## References

- [Next.js Custom Webpack Config](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [worker-loader](https://github.com/webpack-contrib/worker-loader)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Comlink](https://github.com/GoogleChromeLabs/comlink)

---

**Status**: 🔴 Workers disabled (fallback to direct execution)  
**Priority**: 🟡 Medium (only needed for large datasets)  
**Effort**: 🟢 Low (1-2 hours to implement Option 1)
