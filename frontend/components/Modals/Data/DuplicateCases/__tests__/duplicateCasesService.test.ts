import { processDuplicates, generateStatistics } from '../services/duplicateCasesService';

const sampleData = [
    ["ID", "Name", "Age", "City"],
    ["1", "John Smith", "34", "New York"],
    ["2", "Mary Johnson", "29", "Chicago"],
    ["3", "Robert Lee", "45", "San Francisco"],
    ["4", "Lisa Wong", "31", "New York"],
    ["5", "John Smith", "34", "New York"],
    ["6", "David Brown", "42", "Boston"],
    ["7", "Sarah Miller", "36", "Chicago"],
    ["8", "Robert Lee", "45", "Los Angeles"],
    ["9", "James Wilson", "38", "New York"],
    ["10", "Mary Johnson", "29", "Chicago"],
];

describe('Duplicate Cases Service Logic', () => {

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

            const expectedPrimaryValues = [
                0, 0, 1, 1, 1, 1, 1, 1, 1, 1
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

            const expectedPrimaryValues = [
                1, 1, 1, 1, 0, 1, 1, 0, 1, 0
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
            const expectedPrimaryValues = [
                0, 0, 0, 1, 1, 1, 1, 1, 1, 1
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

             const expectedSequenceValues = [
                1, 1, 1, 0, 2, 0, 0, 2, 0, 2
            ];
            expect(result.sequenceValues).toEqual(expectedSequenceValues);

            expect(result.reorderedData).toHaveLength(11);
            
            const reorderedNames = result.reorderedData!.slice(1).map(row => row[1]);
            // 6 duplicates, 4 unique
            const duplicateNames = ["John Smith", "Mary Johnson", "Robert Lee", "John Smith", "Robert Lee", "Mary Johnson"];
            const uniqueNames = ["Lisa Wong", "David Brown", "Sarah Miller", "James Wilson"];

            expect(reorderedNames.slice(0, 6)).toEqual(expect.arrayContaining(duplicateNames));
            expect(reorderedNames.slice(6)).toEqual(expect.arrayContaining(uniqueNames));
        });
    });

    describe('generateStatistics', () => {
        it('should generate frequency table for primary indicator', () => {
            const stats = generateStatistics({
                primaryValues: [1, 0, 1, 0, 1], // 3 primary, 2 duplicates
                sequenceValues: [],
                primaryName: 'PrimaryIndicator',
                sequentialCount: false,
                sequentialName: 'Seq',
            });
    
            expect(stats).toHaveLength(1);
            expect(stats[0].title).toBe('Frequency Table: PrimaryIndicator');
            const rows = stats[0].output_data.rows;
            expect(rows[0]).toMatchObject({ label: 'Duplicate case', count: 2, percent: '40.0' });
            expect(rows[1]).toMatchObject({ label: 'Primary case', count: 3, percent: '60.0' });
            expect(rows[2]).toMatchObject({ label: 'Total', count: 5, percent: '100.0' });
        });
    
        it('should also generate frequency table for sequence when enabled', () => {
             const stats = generateStatistics({
                primaryValues: [1, 0, 1, 0, 1, 1, 0],
                sequenceValues: [1, 2, 0, 1, 0, 1, 2], // 1:3, 2:2, 0:2
                primaryName: 'PrimaryIndicator',
                sequentialCount: true,
                sequentialName: 'MatchSeq',
            });
    
            expect(stats).toHaveLength(2);
            expect(stats[1].title).toBe('Frequency Table: MatchSeq');
            const rows = stats[1].output_data.rows;
            expect(rows).toHaveLength(4);
            expect(rows[0]).toMatchObject({ label: 'Non-matching case', value: '0', count: 2 });
            expect(rows[1]).toMatchObject({ label: 'Sequence 1', value: '1', count: 3 });
            expect(rows[2]).toMatchObject({ label: 'Sequence 2', value: '2', count: 2 });
            expect(rows[3]).toMatchObject({ label: 'Total', count: 7 });
        });
    
        it('should not generate sequence table if disabled', () => {
            const stats = generateStatistics({
                primaryValues: [1, 0, 1, 0, 1, 1, 0],
                sequenceValues: [1, 2, 0, 1, 0, 1, 2],
                primaryName: 'PrimaryIndicator',
                sequentialCount: false,
                sequentialName: 'MatchSeq',
            });
    
            expect(stats).toHaveLength(1);
            expect(stats[0].title).not.toContain('MatchSeq');
        });
    });
}); 