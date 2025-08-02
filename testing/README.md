# Unified Test Architecture for Statify

This directory consolidates all testing frameworks (Playwright, k6, unit tests) into a single, organized structure.

## 🏗️ Unified Directory Structure

```
testing/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── specs/             # Test specifications
│   ├── fixtures/          # Test data and files
│   ├── helpers/           # Test utilities
│   └── playwright.config.ts
├── performance/           # Load tests (k6)
│   ├── scenarios/         # k6 test scripts
│   ├── data/             # Test datasets
│   └── k6.config.js
├── integration/          # Integration tests
├── unit/               # Unit tests
├── reports/            # All test results
│   ├── e2e/
│   ├── performance/
│   └── unit/
└── scripts/            # Test execution scripts
```

## 🚀 Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run smoke tests (fast E2E)
npm run test:smoke

# Run specific test type
npm run test:e2e:headed
npm run test:performance:smoke
```

## 📊 Framework Organization

| Framework | Purpose | Location | Config |
|-----------|---------|----------|--------|
| **Playwright** | E2E testing | `testing/e2e/` | `playwright.config.ts` |
| **k6** | Load testing | `testing/performance/` | `k6.config.js` |
| **Jest** | Unit testing | `testing/unit/` | `jest.config.js` |

## 🔄 Migration Guide

### From Old Structure
- `tests/` → `testing/e2e/`
- `tests-minimal/` → `testing/e2e/specs/smoke/`
- `load-tests/` → `testing/performance/`
- `test-results/` → `testing/reports/`

### File Mapping
| Old Location | New Location |
|--------------|--------------|
| `tests/specs/` → `testing/e2e/specs/` |
| `tests/fixtures/` → `testing/e2e/fixtures/` |
| `tests/helpers/` → `testing/e2e/helpers/` |
| `load-tests/k6-scripts/` → `testing/performance/scenarios/` |
| `test-results/` → `testing/reports/e2e/` |

## 🎯 Configuration

All configurations are optimized for:
- **Minimal setup** - Essential features only
- **Fast execution** - Optimized timeouts and parallelization
- **Clear reporting** - Unified output format
- **Easy maintenance** - Consistent patterns across frameworks
