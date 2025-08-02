# Frontend Load Tests

This directory contains load tests for the Statify frontend application.

## Test Scripts

1. **basic-load-test.js** - Basic load test that simulates users accessing different pages of the application
2. **spss-operations-test.js** - Test that covers frontend pages related to data and variable management
3. **frontend-routes-test.js** - Targeted test that specifically covers all frontend routes in the application (landing, dashboard, data, variable, result, help pages)

## Running Tests

From the project root directory:

```bash
# Run basic load test
npm run test:load:basic

# Run SPSS operations load test
npm run test:load:operations

# Run frontend routes test
npm run test:load:routes

# Run a quick smoke test
npm run test:load:smoke
```
