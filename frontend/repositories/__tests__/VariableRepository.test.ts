import { VariableRepository } from '../VariableRepository';
import db from '@/lib/db';
import { Variable, ValueLabel } from '@/types/Variable';

// A more robust way to mock chained Dexie methods
const mockChainedMethods = {
  equals: jest.fn().mockReturnThis(),
  first: jest.fn(),
  toArray: jest.fn(),
  delete: jest.fn(),
  modify: jest.fn(),
};

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    variables: {
      toArray: jest.fn(),
      where: jest.fn(() => mockChainedMethods),
      put: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      get: jest.fn(),
    },
    valueLabels: {
      where: jest.fn(() => mockChainedMethods),
      put: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Create a typed mock for easier use
const mockedDb = db as jest.Mocked<typeof db>;

// Helper to create a complete mock variable object
const createMockVariable = (props: Partial<Variable>): Variable => ({
  id: 1,
  name: 'VAR1',
  label: 'Variable 1',
  type: 'NUMERIC',
  measure: 'scale',
  width: 8,
  decimals: 2,
  values: [],
  missing: null,
  columnIndex: 0,
  columns: 1,
  align: 'right',
  role: 'input',
  ...props,
});

describe('VariableRepository', () => {
  let repository: VariableRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockChainedMethods).forEach(mockFn => mockFn.mockReset());
    mockChainedMethods.equals.mockReturnThis();
    repository = new VariableRepository();
  });

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('getAllVariables', () => {
    it('should return all variables', async () => {
      const mockVariables = [createMockVariable({})];
      (mockedDb.variables.toArray as jest.Mock).mockResolvedValue(mockVariables);
      const variables = await repository.getAllVariables();
      expect(variables).toEqual(mockVariables);
    });
  });

  describe('getVariableByColumnIndex', () => {
    it('should return a variable when found', async () => {
      const mockVariable = createMockVariable({ columnIndex: 5 });
      (mockChainedMethods.first as jest.Mock).mockResolvedValue(mockVariable);
      const variable = await repository.getVariableByColumnIndex(5);
      expect(variable).toEqual(mockVariable);
      expect(mockedDb.variables.where).toHaveBeenCalledWith('columnIndex');
      expect(mockChainedMethods.equals).toHaveBeenCalledWith(5);
    });
    it('should throw an error on failure', async () => {
        const mockError = new Error('DB Error');
        (mockChainedMethods.first as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.getVariableByColumnIndex(1)).rejects.toThrow(mockError);
    });
  });

  describe('getVariableByName', () => {
    it('should return a variable when found', async () => {
        const mockVariable = createMockVariable({ name: 'TestVar' });
        (mockChainedMethods.first as jest.Mock).mockResolvedValue(mockVariable);
        const result = await repository.getVariableByName('TestVar');
        expect(result).toEqual(mockVariable);
        expect(mockedDb.variables.where).toHaveBeenCalledWith('name');
        expect(mockChainedMethods.equals).toHaveBeenCalledWith('TestVar');
    });
    it('should throw an error on failure', async () => {
        const mockError = new Error('DB Error');
        (mockChainedMethods.first as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.getVariableByName('ErrorVar')).rejects.toThrow(mockError);
    });
  });

  describe('saveVariable', () => {
    it('should save a variable', async () => {
      const newVar = createMockVariable({});
      (mockedDb.variables.put as jest.Mock).mockResolvedValue(123);
      const id = await repository.saveVariable(newVar);
      expect(id).toBe(123);
      expect(mockedDb.variables.put).toHaveBeenCalledWith(newVar);
    });
  });

  describe('deleteVariable', () => {
    it('should delete a variable', async () => {
      await repository.deleteVariable(123);
      expect(mockedDb.variables.delete).toHaveBeenCalledWith(123);
    });
  });

  describe('clearVariables', () => {
    it('should clear variables', async () => {
      await repository.clearVariables();
      expect(mockedDb.variables.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Value Labels Operations', () => {
    describe('getValueLabels', () => {
      it('should return value labels', async () => {
        const mockLabels = [{ variableName: 'VAR1', value: 1, label: 'One' }];
        (mockChainedMethods.toArray as jest.Mock).mockResolvedValue(mockLabels);
        const result = await repository.getValueLabels('VAR1');
        expect(result).toEqual(mockLabels);
        expect(mockedDb.valueLabels.where).toHaveBeenCalledWith('variableName');
        expect(mockChainedMethods.equals).toHaveBeenCalledWith('VAR1');
      });
      it('should throw an error on failure', async () => {
        const mockError = new Error('DB Error');
        (mockChainedMethods.toArray as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.getValueLabels('ErrorVar')).rejects.toThrow(mockError);
      });
    });

    describe('saveValueLabel', () => {
        it('should save a value label', async () => {
          const newLabel = { variableName: 'VAR1', value: 1, label: 'One' };
          (mockedDb.valueLabels.put as jest.Mock).mockResolvedValue(456);
          const id = await repository.saveValueLabel(newLabel);
          expect(id).toBe(456);
          expect(mockedDb.valueLabels.put).toHaveBeenCalledWith(newLabel);
        });
    });

    describe('deleteValueLabel', () => {
        it('should delete a value label', async () => {
          await repository.deleteValueLabel(789);
          expect(mockedDb.valueLabels.delete).toHaveBeenCalledWith(789);
        });
    });

    describe('deleteValueLabelsByVariable', () => {
      it('should delete value labels by variable name', async () => {
        await repository.deleteValueLabelsByVariable('VAR_TO_DELETE');
        expect(mockedDb.valueLabels.where).toHaveBeenCalledWith('variableName');
        expect(mockChainedMethods.equals).toHaveBeenCalledWith('VAR_TO_DELETE');
        expect(mockChainedMethods.delete).toHaveBeenCalledTimes(1);
      });
      it('should throw an error on failure', async () => {
        const mockError = new Error('DB Error');
        (mockChainedMethods.delete as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.deleteValueLabelsByVariable('ErrorVar')).rejects.toThrow(mockError);
      });
    });

    describe('updateValueLabelsVariableName', () => {
      it('should update variable names on value labels', async () => {
        await repository.updateValueLabelsVariableName('OLD', 'NEW');
        expect(mockedDb.valueLabels.where).toHaveBeenCalledWith('variableName');
        expect(mockChainedMethods.equals).toHaveBeenCalledWith('OLD');
        expect(mockChainedMethods.modify).toHaveBeenCalledWith({ variableName: 'NEW' });
      });
      it('should throw an error on failure', async () => {
        const mockError = new Error('DB Error');
        (mockChainedMethods.modify as jest.Mock).mockRejectedValue(mockError);
        await expect(repository.updateValueLabelsVariableName('OLD_FAIL', 'NEW_FAIL')).rejects.toThrow(mockError);
      });
    });
  });
}); 