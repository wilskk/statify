import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SortCasesUI } from '../SortCasesUI';
import { Variable } from '@/types/Variable';

const mockVariables: Variable[] = [
  { tempId: '1', name: 'VAR1', label: 'Variable 1', type: 'NUMERIC', measure: 'scale' },
  { tempId: '2', name: 'VAR2', label: 'Variable 2', type: 'STRING', measure: 'nominal' },
  { tempId: '3', name: 'VAR3', label: 'Variable 3', type: 'NUMERIC', measure: 'ordinal' },
];

describe('SortCasesUI', () => {
  const mockOnClose = jest.fn();
  const mockHandleOk = jest.fn();
  const mockHandleReset = jest.fn();

  const defaultProps = {
    onClose: mockOnClose,
    containerType: 'dialog' as const,
    availableVariables: mockVariables,
    sortByConfigs: [],
    defaultSortOrder: 'asc' as const,
    setDefaultSortOrder: jest.fn(),
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    getSortByVariables: () => [],
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    changeSortDirection: jest.fn(),
    moveVariableUp: jest.fn(),
    moveVariableDown: jest.fn(),
    handleOk: mockHandleOk,
    handleReset: mockHandleReset,
  };

  it('renders the dialog with the correct title', () => {
    render(<SortCasesUI {...defaultProps} />);
    expect(screen.getByText('Sort Cases')).toBeInTheDocument();
  });

  it('renders the OK, Cancel, and Reset buttons', () => {
    render(<SortCasesUI {...defaultProps} />);
    expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('displays the list of available variables', () => {
    render(<SortCasesUI {...defaultProps} />);
    expect(screen.getByText('Variable 1 [VAR1]')).toBeInTheDocument();
    expect(screen.getByText('Variable 2 [VAR2]')).toBeInTheDocument();
    expect(screen.getByText('Variable 3 [VAR3]')).toBeInTheDocument();
  });
});
