import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatisticsTab from '../components/StatisticsTab';
import { DescriptiveStatisticsOptions } from '../types';

// Mock Checkbox, RadioGroup, etc to simple HTML inputs
jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-testid={id}
      checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      readOnly
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => {
  /* eslint-disable react/prop-types */
  return {
    __esModule: true,
    RadioGroup: ({ children, onValueChange }: any) => (
      <div>{React.Children.map(children, (child: any) => React.cloneElement(child, { onValueChange }))}</div>
    ),
    RadioGroupItem: ({ id, value, onValueChange }: any) => (
      <input type="radio" data-testid={id} value={value} onClick={() => onValueChange?.(value)} />
    ),
  };
});

const defaultStats: DescriptiveStatisticsOptions = {
  mean: false,
  sum: false,
  stdDev: false,
  variance: false,
  range: false,
  minimum: false,
  maximum: false,
  standardError: false,
  median: false,
  skewness: false,
  kurtosis: false,
};

describe('StatisticsTab component', () => {
  it('calls updateStatistic when checkbox toggled and display order changed', async () => {
    const updateStatistic = jest.fn();
    const setDisplayOrder = jest.fn();

    render(
      <StatisticsTab
        displayStatistics={{ ...defaultStats, mean: false }}
        updateStatistic={updateStatistic}
        displayOrder="variableList"
        setDisplayOrder={setDisplayOrder}
      />
    );

    // Toggle mean checkbox
    const meanCheckbox = screen.getByTestId('mean');
    fireEvent.click(meanCheckbox);
    expect(updateStatistic).toHaveBeenCalledWith('mean', true);

    // Change display order through radio item
    const alphabeticRadio = screen.getByTestId('alphabetic');
    fireEvent.click(alphabeticRadio);
    expect(setDisplayOrder).toHaveBeenCalledWith('alphabetic');
  });
});