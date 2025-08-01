import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionsTab from '../components/OptionsTab';

describe('OptionsTab Component', () => {
  const mockOnSettingsChange = jest.fn();
  const mockDisplayStatistics = {
    descriptive: false,
    quartiles: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      displayStatistics: mockDisplayStatistics,
      onSettingsChange: mockOnSettingsChange,
      ...props
    };
    return render(<OptionsTab {...defaultProps} />);
  };

  describe('Initial Render', () => {
    it('should render the options tab with correct title', () => {
      renderComponent();
      
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('Display Statistics')).toBeInTheDocument();
    });

    it('should display all available options', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Descriptive')).toBeInTheDocument();
      expect(screen.getByLabelText('Quartiles')).toBeInTheDocument();
    });

    it('should show default settings', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Descriptive')).not.toBeChecked();
      expect(screen.getByLabelText('Quartiles')).not.toBeChecked();
    });
  });

  describe('Display Statistics Options', () => {
    it('should allow toggling descriptive statistics', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      await user.click(descriptiveCheckbox);
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });

    it('should allow toggling quartiles', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const quartilesCheckbox = screen.getByLabelText('Quartiles');
      await user.click(quartilesCheckbox);
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: true
      });
    });

    it('should allow toggling multiple options', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      const quartilesCheckbox = screen.getByLabelText('Quartiles');
      
      await user.click(descriptiveCheckbox);
      await user.click(quartilesCheckbox);
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: true
      });
    });

    it('should maintain state when options are already selected', () => {
      renderComponent({
        displayStatistics: {
          descriptive: true,
          quartiles: true
        }
      });
      
      expect(screen.getByLabelText('Descriptive')).toBeChecked();
      expect(screen.getByLabelText('Quartiles')).toBeChecked();
    });
  });

  describe('Option Descriptions', () => {
    it('should show descriptive statistics description', () => {
      renderComponent();
      
      expect(screen.getByText(/Descriptive statistics include/)).toBeInTheDocument();
    });

    it('should show quartiles description', () => {
      renderComponent();
      
      expect(screen.getByText(/Quartiles show the 25th, 50th, and 75th percentiles/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Descriptive')).toBeInTheDocument();
      expect(screen.getByLabelText('Quartiles')).toBeInTheDocument();
    });

    it('should have proper checkbox roles', () => {
      renderComponent();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      
      // Focus the checkbox
      descriptiveCheckbox.focus();
      expect(descriptiveCheckbox).toHaveFocus();
      
      // Use space to toggle
      await user.keyboard(' ');
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });

    it('should have proper fieldset and legend structure', () => {
      renderComponent();
      
      const fieldset = screen.getByRole('group', { name: /display statistics/i });
      expect(fieldset).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should update when props change', () => {
      const { rerender } = renderComponent({
        displayStatistics: {
          descriptive: false,
          quartiles: false
        }
      });
      
      expect(screen.getByLabelText('Descriptive')).not.toBeChecked();
      
      // Update props
      rerender(
        <OptionsTab
          displayStatistics={{
            descriptive: true,
            quartiles: false
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );
      
      expect(screen.getByLabelText('Descriptive')).toBeChecked();
    });

    it('should call onSettingsChange with correct parameters', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      await user.click(descriptiveCheckbox);
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onSettingsChange', async () => {
      const user = userEvent.setup();
      renderComponent({
        onSettingsChange: undefined
      });
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      
      // Should not throw error when clicking
      await expect(user.click(descriptiveCheckbox)).resolves.not.toThrow();
    });

    it('should handle null displayStatistics', () => {
      renderComponent({
        displayStatistics: null
      });
      
      // Should render with default values
      expect(screen.getByLabelText('Descriptive')).not.toBeChecked();
      expect(screen.getByLabelText('Quartiles')).not.toBeChecked();
    });

    it('should handle partial displayStatistics object', () => {
      renderComponent({
        displayStatistics: {
          descriptive: true
          // quartiles is missing
        }
      });
      
      expect(screen.getByLabelText('Descriptive')).toBeChecked();
      expect(screen.getByLabelText('Quartiles')).not.toBeChecked();
    });
  });

  describe('User Interaction', () => {
    it('should handle rapid clicking', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      
      // Rapid clicks
      await user.click(descriptiveCheckbox);
      await user.click(descriptiveCheckbox);
      await user.click(descriptiveCheckbox);
      
      // Should handle all clicks properly
      expect(mockOnSettingsChange).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard interaction', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      descriptiveCheckbox.focus();
      
      // Use Enter key
      await user.keyboard('{Enter}');
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });
  });

  describe('Visual Feedback', () => {
    it('should show visual feedback when checkbox is checked', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      await user.click(descriptiveCheckbox);
      
      // Checkbox should appear checked
      expect(descriptiveCheckbox).toBeChecked();
    });

    it('should show visual feedback when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      renderComponent({
        displayStatistics: {
          descriptive: true,
          quartiles: false
        }
      });
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      await user.click(descriptiveCheckbox);
      
      // Checkbox should appear unchecked
      expect(descriptiveCheckbox).not.toBeChecked();
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      renderComponent();
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle frequent prop updates efficiently', () => {
      const { rerender } = renderComponent();
      
      const startTime = performance.now();
      
      // Simulate frequent prop updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <OptionsTab
            displayStatistics={{
              descriptive: i % 2 === 0,
              quartiles: i % 3 === 0
            }}
            onSettingsChange={mockOnSettingsChange}
          />
        );
      }
      
      const endTime = performance.now();
      
      // Should handle updates efficiently
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
}); 