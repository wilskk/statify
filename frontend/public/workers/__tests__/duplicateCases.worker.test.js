// Since this is not a real worker, we'll import the functions directly.
// In a real test setup for workers, you might need a different approach.
const { processDuplicates, generateStatistics } = require('../duplicateCases.worker.js');

// Sample data inspired by dummy_duplicate_cases.csv
const sampleData = [
    ["ID", "Name", "Age", "City"],
    ["1", "John Smith", "34", "New York"],   // Group 1
    ["2", "Mary Johnson", "29", "Chicago"],  // Group 2
    ["3", "Robert Lee", "45", "San Francisco"],
    ["4", "Lisa Wong", "31", "New York"],
    ["5", "John Smith", "34", "New York"],   // Group 1
    ["6", "David Brown", "42", "Boston"],
    ["7", "Sarah Miller", "36", "Chicago"],
    ["8", "Robert Lee", "45", "Los Angeles"], // Different City
    ["9", "James Wilson", "38", "New York"],
    ["10", "Mary Johnson", "29", "Chicago"], // Group 2
];

const allVariables = [
    { name: 'ID', columnIndex: 0 },
    { name: 'Name', columnIndex: 1 },
    { name: 'Age', columnIndex: 2 },
    { name: 'City', columnIndex: 3 },
];

describe('Duplicate Cases Worker Logic', () => {

    describe('processDuplicates', () => {
        
        it('should identify exact duplicates based on specific variables', () => {
             const result = processDuplicates({
                data: sampleData,
                matchingVariables: [
                    { name: 'Name', columnIndex: 1 },
                    { name: 'Age', columnIndex: 2 },
                    { name: 'City', columnIndex: 3 },
                ],
                sortingVariables: [],
                sortOrder: 'ascending',
                primaryCaseIndicator: 'last',
            });

            // Groups by Name, Age, City
            // John Smith, 34, New York -> rows 1, 5. Primary is 5 (index 4)
            // Mary Johnson, 29, Chicago -> rows 2, 10. Primary is 10 (index 9)
            const expectedPrimaryValues = [
                0, // John (duplicate)
                0, // Mary (duplicate)
                1, // Robert (unique)
                1, // Lisa (unique)
                1, // John (primary)
                1, // David (unique)
                1, // Sarah (unique)
                1, // Robert (unique)
                1, // James (unique)
                1, // Mary (primary)
            ];
            expect(result.primaryValues).toEqual(expectedPrimaryValues);
        });

        it('should identify partial duplicates and mark the "first" case as primary', () => {
            const result = processDuplicates({
                data: sampleData,
                matchingVariables: [
                    { name: 'Name', columnIndex: 1 },
                    { name: 'Age', columnIndex: 2 }
                ],
                sortingVariables: [],
                sortOrder: 'ascending',
                primaryCaseIndicator: 'first',
            });

            // Groups by Name & Age:
            // - John Smith, 34 (rows 1, 5) -> primary is row 1 (index 0)
            // - Mary Johnson, 29 (rows 2, 10) -> primary is row 2 (index 1)
            // - Robert Lee, 45 (rows 3, 8) -> primary is row 3 (index 2)
            const expectedPrimaryValues = [
                1, // John Smith (primary)
                1, // Mary Johnson (primary)
                1, // Robert Lee (primary)
                1, // Lisa Wong (unique)
                0, // John Smith (duplicate)
                1, // David Brown (unique)
                1, // Sarah Miller (unique)
                0, // Robert Lee (duplicate)
                1, // James Wilson (unique)
                0, // Mary Johnson (duplicate)
            ];

            expect(result.primaryValues).toEqual(expectedPrimaryValues);
        });

        it('should sort within groups to determine the primary case', () => {
            const result = processDuplicates({
                data: sampleData,
                matchingVariables: [
                    { name: 'Name', columnIndex: 1 },
                    { name: 'Age', columnIndex: 2 }
                ],
                sortingVariables: [{ name: 'ID', columnIndex: 0 }],
                sortOrder: 'descending',
                primaryCaseIndicator: 'first',
            });
            // With sorting by ID descending, the order within groups is reversed
            // John Smith group: ID 5 comes before ID 1. Primary is row 5 (index 4).
            // Mary Johnson group: ID 10 before ID 2. Primary is row 10 (index 9).
            // Robert Lee group: ID 8 before ID 3. Primary is row 8 (index 7).
             const expectedPrimaryValues = [
                0, // John Smith (duplicate of 5)
                0, // Mary Johnson (duplicate of 10)
                0, // Robert Lee (duplicate of 8)
                1, // Lisa Wong (unique)
                1, // John Smith (primary)
                1, // David Brown (unique)
                1, // Sarah Miller (unique)
                1, // Robert Lee (primary)
                1, // James Wilson (unique)
                1, // Mary Johnson (primary)
            ];

            expect(result.primaryValues).toEqual(expectedPrimaryValues);
        });

        it('should generate correct sequence numbers and reorder data', () => {
            const result = processDuplicates({
                data: sampleData,
                matchingVariables: [ { name: 'Name', columnIndex: 1 } ],
                sortingVariables: [],
                sortOrder: 'ascending',
                primaryCaseIndicator: 'last',
            });

            // Sequence numbers should be 1-based for matching groups, 0 for unique
            const expectedSequenceValues = [
                1, // John Smith (group size 2)
                1, // Mary Johnson (group size 2)
                1, // Robert Lee (group size 2)
                1, // Lisa Wong (unique)
                2, // John Smith
                1, // David Brown (unique)
                1, // Sarah Miller (unique)
                2, // Robert Lee
                1, // James Wilson (unique)
                2, // Mary Johnson
            ];
            // Unique cases get sequence 0. Groups get 1, 2, ...
             const correctExpectedSequenceValues = [
                1, // John Smith
                1, // Mary Johnson
                1, // Robert Lee
                0, // Lisa Wong
                2, // John Smith
                0, // David Brown
                0, // Sarah Miller
                2, // Robert Lee
                0, // James Wilson
                2, // Mary Johnson
            ];
            expect(result.sequenceValues).toEqual(correctExpectedSequenceValues);

            // Reordered data should have duplicates at the top
            // Headers + 6 duplicates + 4 unique = 11 rows total
            expect(result.reorderedData).toHaveLength(11);
            
            // The first data row should be a duplicate, e.g., John Smith
            expect(result.reorderedData[1][1]).toBe('John Smith'); 
            // The last data row should be a unique entry, e.g., James Wilson
            expect(result.reorderedData[10][1]).toBe('James Wilson');
        });

    });
}); 