import { VariableService } from '../VariableService';
import variableRepository from '@/repositories/VariableRepository';
import db from '@/lib/db';
import { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/repositories/VariableRepository', () => ({
    getAllVariables: jest.fn(),
    getVariableById: jest.fn(),
    deleteVariable: jest.fn(),
    deleteValueLabelsByVariable: jest.fn(),
}));
jest.mock('@/lib/db'); // Keep the db module mocked

const mockedVariableRepository = variableRepository as jest.Mocked<typeof variableRepository>;
const variableService = new VariableService();

// Helper to create a mock variable
const createMockVariable = (id: number, name: string): Variable => ({
    id,
    tempId: `temp-${id}`,
    columnIndex: id,
    name,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    label: '',
    values: [],
    missing: null,
    columns: 64,
    align: 'right',
    measure: 'scale',
    role: 'input',
});

describe('VariableService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllVariables', () => {
        it('should call repository.getAllVariables', async () => {
            const mockVars = [createMockVariable(0, 'VarA')];
            (mockedVariableRepository.getAllVariables as jest.Mock).mockResolvedValue(mockVars);

            const result = await variableService.getAllVariables();

            expect((mockedVariableRepository.getAllVariables as jest.Mock).mock.calls.length).toBe(1);
            expect(result).toBe(mockVars);
        });
    });

    describe('deleteVariable', () => {
        it('should delete the variable and its associated value labels within a transaction', async () => {
            const variableToDelete = createMockVariable(1, 'VarToDelete');
            (mockedVariableRepository.getVariableById as jest.Mock).mockResolvedValue(variableToDelete);
            (mockedVariableRepository.deleteVariable as jest.Mock).mockResolvedValue(undefined); // Correct return type
            (mockedVariableRepository.deleteValueLabelsByVariable as jest.Mock).mockResolvedValue(undefined); // Correct return type

            // Spy on and mock the transaction method, ignoring the type error
            // @ts-ignore - Dexie's PromiseExtended is too complex to mock perfectly
            const transactionSpy = jest.spyOn(db, 'transaction').mockImplementation(async (mode, tables, callback: any) => {
                return await callback();
            });

            await variableService.deleteVariable(1);

            expect(transactionSpy).toHaveBeenCalledTimes(1);
            expect((mockedVariableRepository.deleteVariable as jest.Mock).mock.calls.length).toBe(1);
            expect((mockedVariableRepository.deleteValueLabelsByVariable as jest.Mock).mock.calls.length).toBe(1);
            
            transactionSpy.mockRestore();
        });

        it('should still attempt to delete if variable is not found', async () => {
            (mockedVariableRepository.getVariableById as jest.Mock).mockResolvedValue(undefined);
            (mockedVariableRepository.deleteVariable as jest.Mock).mockResolvedValue(undefined); // Correct return type

            // @ts-ignore
            const transactionSpy = jest.spyOn(db, 'transaction');

            await variableService.deleteVariable(99);

            expect(transactionSpy).not.toHaveBeenCalled();
            expect((mockedVariableRepository.deleteVariable as jest.Mock).mock.calls.length).toBe(1);
            
            transactionSpy.mockRestore();
        });
    });
}); 