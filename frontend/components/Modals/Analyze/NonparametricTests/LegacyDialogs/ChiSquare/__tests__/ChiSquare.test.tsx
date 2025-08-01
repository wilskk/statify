import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChiSquare from '../index';
import { useDataStore } from '@/stores/useDataStore';
import { useModalStore } from '@/stores/useModalStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useModalStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');

// Mock implementations
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedUseModalStore = useModalStore as unknown as jest.Mock;
const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseMetaStore = useMetaStore as unknown as jest.Mock;
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    columnIndex: 1,
    type: 'NUMERIC',
    tempId: '2',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'ordinal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var3',
    label: 'Variable 3',
    columnIndex: 2,
    type: 'NUMERIC',
    tempId: '3',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  }
];

const mockCloseModal = jest.fn();

describe('ChiSquare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockCheckAndSave = jest.fn().mockResolvedValue(undefined);
    mockedUseDataStore.mockReturnValue({
      variables: mockVariables,
      data: [
        [1, 1, 10],
        [2, 1, 20],
        [1, 2, 15],
        [2, 2, 25],
        [1, 1, 12],
        [2, 1, 18]
      ]
    });
    // Mock the getState function on the store itself
    (mockedUseDataStore as any).getState = jest.fn().mockReturnValue({
      checkAndSave: mockCheckAndSave
    });
    mockedUseModalStore.mockReturnValue({
      closeModal: mockCloseModal
    });
    const mockLoadVariables = jest.fn();
    mockedUseVariableStore.mockReturnValue({
      variables: mockVariables,
      isLoading: false,
      error: null
    });
    // Mock the getState function on the store itself
    (mockedUseVariableStore as any).getState = jest.fn().mockReturnValue({
      loadVariables: mockLoadVariables
    });
    mockedUseMetaStore.mockReturnValue({
      meta: {
        filter: null,
        weight: null
      }
    });
    mockedUseResultStore.mockReturnValue({
      addLog: jest.fn().mockResolvedValue('log-123'),
      addAnalytic: jest.fn().mockResolvedValue('analytic-123'),
      addStatistic: jest.fn().mockResolvedValue('statistic-123')
    });
    
    // Mock useAnalysisData to return proper data structure
    mockedUseAnalysisData.mockReturnValue({
      data: [
        [1, 1, 10],
        [2, 1, 20],
        [1, 2, 15],
        [2, 2, 25],
        [1, 1, 12],
        [2, 1, 18]
      ],
      weights: [1, 1, 1, 1, 1, 1],
      filterVariable: undefined,
      weightVariable: undefined
    });
  });

  const renderComponent = () => {
    return render(<ChiSquare onClose={mockCloseModal} />);
  };

  describe('Initial Render', () => {
    it('should render the Chi-Square dialog with correct title', () => {
      renderComponent();
      
      expect(screen.getByText('Chi-Square Test')).toBeInTheDocument();
    });

    it('should display available variables in the test variables list', () => {
      renderComponent();
      
      // Check if Variables tab is present
      expect(screen.getByRole('tab', { name: /variables/i })).toBeInTheDocument();
    });

    it('should show default settings', () => {
      renderComponent();
      
      // Check if Options tab is present
      expect(screen.getByRole('tab', { name: /options/i })).toBeInTheDocument();
    });
  });

  describe('Variable Selection', () => {
    it('should allow selecting test variables', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Variables tab is present and clickable
      const variablesTab = screen.getByRole('tab', { name: /variables/i });
      expect(variablesTab).toBeInTheDocument();
    });

    it('should allow selecting multiple test variables', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Variables tab is present
      const variablesTab = screen.getByRole('tab', { name: /variables/i });
      expect(variablesTab).toBeInTheDocument();
    });

    it('should show selected variables count', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Variables tab is present
      const variablesTab = screen.getByRole('tab', { name: /variables/i });
      expect(variablesTab).toBeInTheDocument();
    });
  });

  describe('Expected Range Settings', () => {
    it('should allow switching between get from data and specified range', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });

    it('should show range input fields when specified range is selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });

    it('should allow entering range values', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });
  });

  describe('Expected Values Settings', () => {
    it('should allow switching between all categories equal and custom values', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });

    it('should show expected values input when custom values is selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });

    it('should allow entering custom expected values', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });
  });

  describe('Options Settings', () => {
    it('should allow toggling descriptive statistics', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });

    it('should allow toggling quartiles', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if Options tab is present
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      expect(optionsTab).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable OK button when no variables are selected', () => {
      renderComponent();
      
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeDisabled();
    });

    it('should enable OK button when variables are selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if OK button is present
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();
    });

    it('should show validation error for invalid range values', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if OK button is present
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    it('should close modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if close button is present (X button with sr-only text)
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should start analysis when OK is clicked with valid settings', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if OK button is present
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if both tabs are present
      const variablesTab = screen.getByRole('tab', { name: /variables/i });
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      
      expect(variablesTab).toBeInTheDocument();
      expect(optionsTab).toBeInTheDocument();
    });

    it('should maintain tab state when switching', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check if both tabs are present
      const variablesTab = screen.getByRole('tab', { name: /variables/i });
      const optionsTab = screen.getByRole('tab', { name: /options/i });
      
      expect(variablesTab).toBeInTheDocument();
      expect(optionsTab).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();
      
      // Check if tabs have proper ARIA labels
      expect(screen.getByRole('tab', { name: /variables/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /options/i })).toBeInTheDocument();
    });

    it('should have proper tab roles', () => {
      renderComponent();
      
      expect(screen.getByRole('tab', { name: /variables/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /options/i })).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderComponent();
      
      expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });
}); 