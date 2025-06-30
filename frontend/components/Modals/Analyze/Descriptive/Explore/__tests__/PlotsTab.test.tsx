import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlotsTab from '../PlotsTab';

describe('PlotsTab Component', () => {

    const mockProps = {
        boxplotType: 'dependents-together' as const,
        showStemAndLeaf: false,
        showHistogram: false,
        showNormalityPlots: false,
        factorVariablesCount: 1,
        tourActive: false,
        setBoxplotType: jest.fn(),
        setShowStemAndLeaf: jest.fn(),
        setShowHistogram: jest.fn(),
        setShowNormalityPlots: jest.fn(),
        resetPlotsSettings: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render all options correctly', () => {
        render(<PlotsTab {...mockProps} />);
        
        expect(screen.getByText('Boxplots')).toBeInTheDocument();
        expect(screen.getByLabelText('Factor levels together')).toBeInTheDocument();
        expect(screen.getByLabelText('Dependents together')).toBeInTheDocument();
        expect(screen.getByLabelText('Stem-and-leaf')).toBeInTheDocument();
        expect(screen.getByLabelText('Histogram')).toBeInTheDocument();
        expect(screen.getByLabelText('Normality plots with tests')).toBeInTheDocument();
    });

    it('should call setBoxplotType when a boxplot option is selected', async () => {
        render(<PlotsTab {...mockProps} />);
        const user = userEvent.setup();

        const factorLevelsRadio = screen.getByLabelText('Factor levels together');
        await user.click(factorLevelsRadio);

        expect(mockProps.setBoxplotType).toHaveBeenCalledWith('factor-levels-together');
    });

    it('should call setShowStemAndLeaf when the stem-and-leaf checkbox is clicked', async () => {
        render(<PlotsTab {...mockProps} />);
        const user = userEvent.setup();
        
        const checkbox = screen.getByLabelText('Stem-and-leaf');
        await user.click(checkbox);
        
        expect(mockProps.setShowStemAndLeaf).toHaveBeenCalledWith(true);
    });

    it('should call setShowHistogram when the histogram checkbox is clicked', async () => {
        render(<PlotsTab {...mockProps} />);
        const user = userEvent.setup();
        
        const checkbox = screen.getByLabelText('Histogram');
        await user.click(checkbox);
        
        expect(mockProps.setShowHistogram).toHaveBeenCalledWith(true);
    });

    it('should call setShowNormalityPlots when the normality plots checkbox is clicked', async () => {
        render(<PlotsTab {...mockProps} />);
        const user = userEvent.setup();
        
        const checkbox = screen.getByLabelText('Normality plots with tests');
        await user.click(checkbox);
        
        expect(mockProps.setShowNormalityPlots).toHaveBeenCalledWith(true);
    });

    it('should disable boxplot options when factorVariablesCount is 0', () => {
        render(<PlotsTab {...mockProps} factorVariablesCount={0} />);
        
        const factorLevelsRadio = screen.getByLabelText('Factor levels together');
        const dependentsRadio = screen.getByLabelText('Dependents together');
        
        expect(factorLevelsRadio).toBeDisabled();
        expect(dependentsRadio).toBeDisabled();
        expect(screen.getByText(/Boxplot options are available when/)).toBeInTheDocument();
    });

    it('should enable boxplot options when factorVariablesCount is greater than 0', () => {
        render(<PlotsTab {...mockProps} factorVariablesCount={1} />);
        
        const factorLevelsRadio = screen.getByLabelText('Factor levels together');
        const dependentsRadio = screen.getByLabelText('Dependents together');
        
        expect(factorLevelsRadio).toBeEnabled();
        expect(dependentsRadio).toBeEnabled();
        expect(screen.queryByText(/Boxplot options are available when/)).not.toBeInTheDocument();
    });

}); 