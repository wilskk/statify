# Chi-Square Test - Test Documentation

This directory contains comprehensive test suites for the Chi-Square Test component and its related functionality.

## Test Files Overview

### Core Component Tests

#### `ChiSquare.test.tsx`
Tests for the main Chi-Square dialog component including:
- Initial rendering and UI elements
- Variable selection functionality
- Expected range and values configuration
- Options and settings management
- Form validation and error handling
- Tab navigation and accessibility
- Button actions and user interactions

#### `VariablesTab.test.tsx`
Tests for the variables selection tab including:
- Variable list rendering and display
- Single and multiple variable selection
- Variable information display (type, measure, etc.)
- Accessibility features (ARIA labels, keyboard navigation)
- Edge cases (empty lists, null values)
- Performance with large variable sets

#### `OptionsTab.test.tsx`
Tests for the options configuration tab including:
- Display statistics options (descriptive, quartiles)
- Setting toggles and state management
- Option descriptions and help text
- Accessibility and keyboard navigation
- Form validation and user feedback

### Hook Tests

#### `useChiSquareAnalysis.test.ts`
Tests for the main analysis hook including:
- Worker communication and data processing
- Analysis execution and result handling
- Error handling and edge cases
- Multiple variable processing
- Custom expected values and ranges
- Statistics display options

#### `useVariableSelection.test.ts`
Tests for variable selection management including:
- Variable selection state management
- Bulk operations (select all, deselect all)
- Selection validation and constraints
- Performance with large variable sets
- State persistence and updates

#### `useTestSettings.test.ts`
Tests for test configuration settings including:
- Setting updates and toggles
- Bulk operations (enable all, disable all)
- Setting queries and status checks
- State consistency and validation
- Performance optimization

#### `useTourGuide.test.ts`
Tests for the tour guide functionality including:
- Tour navigation (next, previous, skip)
- Step management and progress tracking
- Tour completion and callback handling
- State persistence and configuration
- Edge cases and error handling

### Utility Tests

#### `formatters.test.ts`
Tests for data formatting utilities including:
- Number formatting with precision
- P-value formatting and significance levels
- Chi-square test table formatting
- Frequencies table formatting
- Error table formatting
- Edge cases and null value handling

## Test Coverage

### Component Coverage
- ✅ Initial rendering and UI elements
- ✅ User interactions and state changes
- ✅ Form validation and error handling
- ✅ Accessibility features
- ✅ Performance optimization
- ✅ Edge cases and error scenarios

### Hook Coverage
- ✅ State management and updates
- ✅ Side effects and cleanup
- ✅ Error handling and recovery
- ✅ Performance optimization
- ✅ Integration with external services

### Utility Coverage
- ✅ Data transformation and formatting
- ✅ Input validation and sanitization
- ✅ Edge cases and error conditions
- ✅ Performance with large datasets

## Running Tests

### Run All Tests
```bash
npm test ChiSquare
```

### Run Specific Test File
```bash
npm test ChiSquare.test.tsx
npm test useChiSquareAnalysis.test.ts
npm test formatters.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage --collectCoverageFrom="**/ChiSquare/**"
```

## Test Patterns

### Component Testing
- Use `@testing-library/react` for component rendering
- Use `@testing-library/user-event` for user interactions
- Mock external dependencies (stores, hooks, workers)
- Test accessibility features and keyboard navigation
- Verify state changes and callback invocations

### Hook Testing
- Use `@testing-library/react-hooks` for hook testing
- Test state initialization and updates
- Verify side effects and cleanup
- Test error handling and edge cases
- Mock external dependencies appropriately

### Utility Testing
- Test pure functions with various inputs
- Verify output formatting and precision
- Test edge cases and error conditions
- Ensure performance with large datasets

## Mocking Strategy

### External Dependencies
- **Stores**: Mock `useDataStore`, `useModalStore`, `useResultStore`
- **Hooks**: Mock `useAnalysisData` and other custom hooks
- **Workers**: Mock Web Worker communication
- **APIs**: Mock external API calls and services

### Mock Data
- Use realistic test data that represents actual usage
- Include edge cases and error conditions
- Provide comprehensive variable definitions
- Include various data types and formats

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the behavior
- Separate setup, execution, and assertion phases
- Use `beforeEach` for common setup

### Assertions
- Test one concept per test case
- Use specific assertions that verify exact behavior
- Test both positive and negative cases
- Verify side effects and state changes

### Performance
- Test with realistic data sizes
- Verify performance characteristics
- Test memory usage and cleanup
- Monitor test execution time

## Common Test Scenarios

### Variable Selection
- Single variable selection
- Multiple variable selection
- Bulk operations (select all, deselect all)
- Validation and constraints
- Performance with large variable sets

### Analysis Configuration
- Expected range settings
- Expected values configuration
- Display statistics options
- Form validation and error handling

### Data Processing
- Worker communication
- Result formatting and display
- Error handling and recovery
- Performance optimization

### User Experience
- Accessibility features
- Keyboard navigation
- Visual feedback
- Error messages and help text

## Troubleshooting

### Common Issues
1. **Mock not working**: Ensure mocks are properly configured and imported
2. **Async test failures**: Use `waitFor` or `act` for async operations
3. **State not updating**: Verify state management and re-renders
4. **Worker communication**: Mock worker messages and responses

### Debug Tips
- Use `screen.debug()` to inspect rendered output
- Add `console.log` statements for debugging
- Check mock implementations and return values
- Verify test data and expected results

## Contributing

When adding new tests:
1. Follow existing patterns and conventions
2. Ensure comprehensive coverage of new functionality
3. Include edge cases and error scenarios
4. Test performance characteristics
5. Update this documentation as needed

## Related Documentation

- [Chi-Square Test Component](../README.md)
- [Testing Guidelines](../../../../../../README.md)
- [Component Architecture](../../../../../../ARCHITECTURE.md) 