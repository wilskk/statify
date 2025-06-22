import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Descriptives from '..';

// Mock custom hooks
jest.mock('../hooks/useDescriptive', () => ({
  __esModule: true,
  default: () => ({
    variable: [],
    setVariable: jest.fn(),
    options: {
      mean: true,
      stddev: true,
      minimum: true,
      maximum: true,
    },
    setOptions: jest.fn(),
    handleReset: jest.fn(),
  }),
}));

jest.mock('@/hooks/useProject', () => ({
  useProject: () => ({ 
    project: { id: '1', name: 'Test Project' },
    runAnalysis: jest.fn(),
  }),
}));

jest.mock('@/hooks/useVariable', () => ({
  useVariable: () => ({ 
    variables: [
      { id: 'var1', name: 'Variable 1', type: 'Numeric' },
      { id: 'var2', name: 'Variable 2', type: 'Numeric' },
    ]
  }),
}));

jest.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ settings: {} }),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Mock sub-components that might have their own complex logic
jest.mock('@/components/VariableSelection', () => ({
    __esModule: true,
    default: ({ label }: { label: string }) => <div>{label}</div>,
}));

describe('Descriptives Component', () => {
  it('renders the dialog with title and essential controls', () => {
    render(<Descriptives onClose={jest.fn()} />);

    // Check for the main title
    expect(screen.getByText('Descriptive Statistics')).toBeInTheDocument();

    // Check if the variable selection component is rendered (based on its label)
    expect(screen.getByText('Variable(s):')).toBeInTheDocument();

    // Check for action buttons
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    // Check for options checkboxes
    expect(screen.getByLabelText('Mean')).toBeInTheDocument();
    expect(screen.getByLabelText('Std. deviation')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum')).toBeInTheDocument();
  });
});
