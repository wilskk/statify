import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Transpose from '..'; // Assuming the main component is exported from index.tsx

// Mock dependencies
jest.mock('../hooks/useTranspose', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    selectedVariables: [],
    transposedData: null,
    loading: false,
    error: null,
    handleVariableChange: jest.fn(),
    handleTranspose: jest.fn(),
  })),
}));

jest.mock('../services/transposeService', () => ({
  __esModule: true,
  transposeData: jest.fn(),
}));

describe('Transpose Component', () => {
  it('should render the component correctly', () => {
    render(<Transpose variables={[]} />);

    // Check for a title or a key element in your component
    // Replace 'Transpose Data' with an actual text from your component
    expect(screen.getByText(/Transpose Data/i)).toBeInTheDocument(); 
  });

  it('should display variables for selection', () => {
    const mockVariables = [
      { id: '1', name: 'Var1', type: 'numeric', data: [1, 2, 3] },
      { id: '2', name: 'Var2', type: 'numeric', data: [4, 5, 6] },
    ];

    render(<Transpose variables={mockVariables} />);

    // Check if the variables are rendered
    expect(screen.getByText('Var1')).toBeInTheDocument();
    expect(screen.getByText('Var2')).toBeInTheDocument();
  });

  it('should call handleVariableChange when a variable is selected', () => {
    const mockVariables = [
      { id: '1', name: 'Var1', type: 'numeric', data: [1, 2, 3] },
    ];
    const { useTranspose } = require('../hooks/useTranspose');
    const mockHook = {
        ...jest.requireActual('../hooks/useTranspose').default(),
        handleVariableChange: jest.fn(),
    };
    useTranspose.mockImplementation(() => mockHook);

    render(<Transpose variables={mockVariables} />);
    
    // Simulate variable selection (e.g., clicking a checkbox)
    // You might need to adjust the role and name based on your actual implementation
    fireEvent.click(screen.getByRole('checkbox', { name: /Var1/i }));

    expect(mockHook.handleVariableChange).toHaveBeenCalled();
  });

  it('should call handleTranspose when the transpose button is clicked', async () => {
    const { useTranspose } = require('../hooks/useTranspose');
    const mockHook = {
        ...jest.requireActual('../hooks/useTranspose').default(),
        handleTranspose: jest.fn(),
    };
    useTranspose.mockImplementation(() => mockHook);

    render(<Transpose variables={[]} />);

    // Simulate clicking the transpose button
    // Replace 'Transpose' with the actual button text
    fireEvent.click(screen.getByRole('button', { name: /Transpose/i }));

    await waitFor(() => {
      expect(mockHook.handleTranspose).toHaveBeenCalled();
    });
  });

  // Add more tests for loading state, error handling, and result display
});
