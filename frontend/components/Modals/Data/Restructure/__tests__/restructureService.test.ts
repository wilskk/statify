import { restructureData } from '../services/restructureService';
import { RestructureConfig, RestructureMethod } from '../types';
import { Variable } from '@/types/Variable';
import { DataRow } from '@/types/Data';

// Mock data based on README and component implementation
const mockVariables: Variable[] = [
    { id: 1, name: 'SubjectID', columnIndex: 0, type: 'NUMERIC', measure: 'nominal', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 2, name: 'Age', columnIndex: 1, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 3, name: 'Gender', columnIndex: 2, type: 'STRING', measure: 'nominal', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'left', role: 'input' },
    { id: 4, name: 'Score1', columnIndex: 3, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 5, name: 'Score2', columnIndex: 4, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 6, name: 'Score3', columnIndex: 5, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
];

const mockWideData: DataRow[] = [
    [1, 25, 'M', 85, 90, 78],
    [2, 30, 'F', 92, 88, 95],
    [3, 28, 'M', 75, 82, 80],
];

const mockLongVariables: Variable[] = [
    { id: 1, name: 'SubjectID', columnIndex: 0, type: 'NUMERIC', measure: 'nominal', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 2, name: 'TimePoint', columnIndex: 1, type: 'NUMERIC', measure: 'nominal', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
    { id: 3, name: 'Score', columnIndex: 2, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
];

const mockLongData: DataRow[] = [
    [1, 1, 85], [1, 2, 90], [1, 3, 78],
    [2, 1, 92], [2, 2, 88], [2, 3, 95],
    [3, 1, 75], [3, 2, 82], [3, 3, 80],
];


describe('restructureService', () => {

    describe('wideToLong (Variables to Cases)', () => {
        it('should correctly restructure data from wide to long format with index and count', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.VariablesToCases,
                selectedVariables: [{ name: 'Score1', columnIndex: 3, type: 'NUMERIC', measure: 'scale' }, { name: 'Score2', columnIndex: 4, type: 'NUMERIC', measure: 'scale' }, { name: 'Score3', columnIndex: 5, type: 'NUMERIC', measure: 'scale' }],
                indexVariables: [{ name: 'SubjectID', columnIndex: 0, type: 'NUMERIC', measure: 'nominal' }, { name: 'Age', columnIndex: 1, type: 'NUMERIC', measure: 'scale' }, { name: 'Gender', columnIndex: 2, type: 'STRING', measure: 'nominal' }],
                identifierVariables: [],
                options: { createIndex: true, createCount: true, dropEmptyVariables: false },
            };

            const { data, variables } = restructureData(mockWideData, mockVariables, config);

            // Verify variables
            expect(variables.map(v => v.name)).toEqual(['SubjectID', 'Age', 'Gender', 'value', 'variable', 'count']);
            
            // Verify data
            expect(data).toHaveLength(9);
            expect(data[0]).toEqual([1, 25, 'M', 85, 'Score1', 3]);
            expect(data[1]).toEqual([1, 25, 'M', 90, 'Score2', 3]);
            expect(data[2]).toEqual([1, 25, 'M', 78, 'Score3', 3]);
            expect(data[3]).toEqual([2, 30, 'F', 92, 'Score1', 3]);
        });
    });

    describe('longToWide (Cases to Variables)', () => {
        it('should correctly restructure data from long to wide format', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.CasesToVariables,
                selectedVariables: [{ name: 'Score', columnIndex: 2, type: 'NUMERIC', measure: 'scale' }],
                identifierVariables: [{ name: 'TimePoint', columnIndex: 1, type: 'NUMERIC', measure: 'nominal' }],
                indexVariables: [],
                options: { dropEmptyVariables: false, createCount: false, createIndex: false },
            };

            const { data, variables } = restructureData(mockLongData, mockLongVariables, config);
            
            expect(variables.map(v => v.name)).toEqual(['SubjectID', 'Score_1', 'Score_2', 'Score_3']);
            
            expect(data).toHaveLength(3);
            expect(data[0]).toEqual([1, 85, 90, 78]);
            expect(data[1]).toEqual([2, 92, 88, 95]);
            expect(data[2]).toEqual([3, 75, 82, 80]);
        });
    });

    describe('transposeAll', () => {
        it('should correctly transpose the entire dataset', () => {
            const config: RestructureConfig = {
                method: RestructureMethod.TransposeAllData,
                selectedVariables: [],
                indexVariables: [],
                identifierVariables: [],
                options: { createCount: false, createIndex: false, dropEmptyVariables: false },
            };
            const simpleData = [[1, 2], [3, 4]];
            const simpleVars = [
                { id: 1, name: 'A', columnIndex: 0, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' },
                { id: 2, name: 'B', columnIndex: 1, type: 'NUMERIC', measure: 'scale', width: 8, decimals: 0, label: '', values: [], missing: null, columns: 1, align: 'right', role: 'input' }
            ];

            const { data, variables } = restructureData(simpleData, simpleVars, config);

            expect(variables).toHaveLength(2);
            expect(variables.map(v => v.name)).toEqual(['V1', 'V2']);
            expect(data).toEqual([[1, 3], [2, 4]]);
        });
    });
}); 