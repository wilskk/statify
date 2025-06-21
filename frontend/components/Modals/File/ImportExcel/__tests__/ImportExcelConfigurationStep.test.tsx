import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportExcelConfigurationStep } from '../components/ImportExcelConfigurationStep';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import * as utils from '../importExcel.utils';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('../importExcel.utils');
jest.mock('handsontable/react-wrapper', () => ({
  HotTable: jest.fn(() => <div>Mocked HotTable</div>),
}));

const mockSetData = jest.fn();
const mockOverwriteVariables = jest.fn();
const mockResetData = jest.fn();
const mockResetVariables = jest.fn();

const mockParseSheetForPreview = utils.parseSheetForPreview as jest.Mock;
const mockProcessSheetForImport = utils.processSheetForImport as jest.Mock;
const mockGenerateVariablesFromData = utils.generateVariablesFromData as jest.Mock;

(useDataStore as jest.Mock).mockReturnValue({ setData: mockSetData, resetData: mockResetData });
(useVariableStore as jest.Mock).mockReturnValue({ overwriteVariables: mockOverwriteVariables, resetVariables: mockResetVariables });

const mockParsedSheets = [
    { sheetName: 'Sheet1', data: [['Name', 'Age'], ['Alice', 20]]},
    { sheetName: 'Sheet2', data: [['Product', 'Price'], ['A', 100]]}
];

describe('ImportExcelConfigurationStep Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementations for utils
        mockParseSheetForPreview.mockReturnValue({ data: [['Alice', 20]], headers: ['Name', 'Age'] });
        mockProcessSheetForImport.mockReturnValue({ processedFullData: [['Alice', 20]], actualHeaders: ['Name', 'Age'] });
        mockGenerateVariablesFromData.mockReturnValue([{ name: 'Name', type: 'STRING'}, { name: 'Age', type: 'NUMERIC' }]);
    });

    const renderComponent = (props = {}) => {
        const defaultProps = {
            onClose: jest.fn(),
            onBack: jest.fn(),
            fileName: 'test.xlsx',
            parsedSheets: mockParsedSheets,
            ...props
        };
        return render(<ImportExcelConfigurationStep {...defaultProps} />);
    }

    it('renders correctly with initial data', () => {
        renderComponent();
        expect(screen.getByText(/configure: test.xlsx/i)).toBeInTheDocument();
        expect(screen.getByText('Sheet1')).toBeInTheDocument(); // Select trigger display value
        expect(screen.getByText('Mocked HotTable')).toBeInTheDocument();
        expect(mockParseSheetForPreview).toHaveBeenCalledTimes(1);
    });

    it('updates preview when worksheet is changed', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        expect(mockParseSheetForPreview).toHaveBeenCalledTimes(1);
        
        const sheetSelect = screen.getByRole('combobox');
        await user.click(sheetSelect);
        await user.click(screen.getByText('Sheet2'));

        expect(mockParseSheetForPreview).toHaveBeenCalledTimes(2);
        // Ensure it was called with options for Sheet2
        expect(mockParseSheetForPreview).toHaveBeenLastCalledWith(
            expect.objectContaining({ sheetName: 'Sheet2' }),
            expect.any(Object)
        );
    });

    it('calls import process and store actions on "Import Data" click', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const importButton = screen.getByRole('button', { name: /import data/i });
        await user.click(importButton);

        expect(mockResetData).toHaveBeenCalledTimes(1);
        expect(mockResetVariables).toHaveBeenCalledTimes(1);
        expect(mockProcessSheetForImport).toHaveBeenCalledTimes(1);
        expect(mockGenerateVariablesFromData).toHaveBeenCalledTimes(1);
        expect(mockOverwriteVariables).toHaveBeenCalledTimes(1);
        expect(mockSetData).toHaveBeenCalledTimes(1);
    });
    
    it('displays an error if import processing fails', async () => {
        const user = userEvent.setup();
        const errorMessage = 'Import failed';
        mockProcessSheetForImport.mockReturnValue({ error: errorMessage });
        renderComponent();

        const importButton = screen.getByRole('button', { name: /import data/i });
        await user.click(importButton);

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();
        expect(mockSetData).not.toHaveBeenCalled();
    });

}); 