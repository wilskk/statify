import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertiesEditor from '../PropertiesEditor';
import { usePropertiesEditor } from '../hooks/usePropertiesEditor';
import { Variable } from '@/types/Variable';

jest.mock('../hooks/usePropertiesEditor');
jest.mock('@handsontable/react-wrapper', () => ({
    __esModule: true,
    HotTable: jest.fn(() => <div>Mocked HotTable</div>)
}));

const mockedUsePropertiesEditor = usePropertiesEditor as jest.Mock;

const mockVariable: Variable = {
  tempId: '1', name: 'var1', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left', label: 'Variable 1'
};

const getMockedHookState = (currentVariable: Variable | null = mockVariable, activeTab = 'properties') => ({
    modifiedVariables: currentVariable ? [currentVariable] : [],
    selectedVariableIndex: currentVariable ? 0 : null,
    currentVariable,
    gridData: [],
    showTypeDropdown: false, setShowTypeDropdown: jest.fn(),
    showRoleDropdown: false, setShowRoleDropdown: jest.fn(),
    showMeasureDropdown: false, setShowMeasureDropdown: jest.fn(),
    showDateFormatDropdown: false, setShowDateFormatDropdown: jest.fn(),
    errorMessage: null, errorDialogOpen: false, setErrorDialogOpen: jest.fn(),
    suggestDialogOpen: false, setSuggestDialogOpen: jest.fn(),
    suggestedMeasure: "", measurementExplanation: "",
    unlabeledValuesCount: 0,
    activeTab, setActiveTab: jest.fn(),
    handleVariableChange: jest.fn(),
    handleVariableFieldChange: jest.fn(),
    handleGridDataChange: jest.fn(),
    handleAutoLabel: jest.fn(),
    handleSuggestMeasurement: jest.fn(),
    handleAcceptSuggestion: jest.fn(),
    handleSave: jest.fn(),
});


describe('PropertiesEditor', () => {
    const onClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the editor with a selected variable on Properties tab', () => {
        mockedUsePropertiesEditor.mockReturnValue(getMockedHookState());
        render(<PropertiesEditor onClose={onClose} variables={[mockVariable]} caseLimit="50" valueLimit="200" />);
        
        expect(screen.getByText('Define Variable Properties')).toBeInTheDocument();
        expect(screen.getByDisplayValue('var1')).toBeInTheDocument();
        expect(screen.getByText('Properties')).toBeInTheDocument();
    });

    it('shows a message when no variable is selected', () => {
        mockedUsePropertiesEditor.mockReturnValue(getMockedHookState(null));
        render(<PropertiesEditor onClose={onClose} variables={[]} caseLimit="50" valueLimit="200" />);

        expect(screen.getByText(/Select a variable from the list/i)).toBeInTheDocument();
    });

    it('shows HotTable when Value Labels tab is active', () => {
        mockedUsePropertiesEditor.mockReturnValue(getMockedHookState(mockVariable, 'labels'));
        render(<PropertiesEditor onClose={onClose} variables={[mockVariable]} caseLimit="50" valueLimit="200" />);

        expect(screen.getByText('Mocked HotTable')).toBeInTheDocument();
    });

    it('calls handleSave when OK button is clicked', async () => {
        const user = userEvent.setup();
        const handleSave = jest.fn();
        mockedUsePropertiesEditor.mockReturnValue({...getMockedHookState(), handleSave});

        render(<PropertiesEditor onClose={onClose} variables={[mockVariable]} caseLimit="50" valueLimit="200" />);
        
        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);
        
        expect(handleSave).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
        const user = userEvent.setup();
        mockedUsePropertiesEditor.mockReturnValue(getMockedHookState());
        render(<PropertiesEditor onClose={onClose} variables={[mockVariable]} caseLimit="50" valueLimit="200" />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
}); 