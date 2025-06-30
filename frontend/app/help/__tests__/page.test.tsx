import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpPage from '../page';

// Mock child components
jest.mock('../components/Sidebar', () => {
    const MockSidebar = () => <aside>Help Sidebar</aside>;
    MockSidebar.displayName = 'MockSidebar';
    return MockSidebar;
});
jest.mock('../components/HelpContent', () => {
    const MockGettingStarted = () => <div>Getting Started Section</div>;
    MockGettingStarted.displayName = 'MockGettingStarted';

    const MockFAQ = () => (
        <div>
            <h2>Frequently Asked Questions</h2>
            <details>
                <summary>What is Statify?</summary>
                <p>A web-based statistical tool.</p>
            </details>
        </div>
    );
    MockFAQ.displayName = 'MockFAQ';

    const MockFeedbackForm = () => (
        <form>
            <label htmlFor="feedback">Feedback</label>
            <textarea id="feedback"></textarea>
            <button type="submit">Submit</button>
        </form>
    );
    MockFeedbackForm.displayName = 'MockFeedbackForm';

    return {
        GettingStarted: MockGettingStarted,
        FAQ: MockFAQ,
        FeedbackForm: MockFeedbackForm,
    }
});

describe('HelpPage', () => {
    it('should render all main components of the help page', () => {
        render(<HelpPage />);
        
        expect(screen.getByText('Help Sidebar')).toBeInTheDocument();
        expect(screen.getByText('Getting Started Section')).toBeInTheDocument();
        expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
        expect(screen.getByLabelText('Feedback')).toBeInTheDocument();
    });

    it('should allow interaction with FAQ items', () => {
        render(<HelpPage />);
        const faqSummary = screen.getByText('What is Statify?');
        const detailsElement = faqSummary.closest('details');

        expect(detailsElement).not.toHaveAttribute('open');
        fireEvent.click(faqSummary);
        expect(detailsElement).toHaveAttribute('open');
    });

    it('should handle feedback form submission', () => {
        // This test would be more detailed, checking for form validation and submission logic.
        // For now, it just checks for presence of the form elements.
        render(<HelpPage />);
        
        const feedbackInput = screen.getByLabelText('Feedback');
        const submitButton = screen.getByRole('button', { name: 'Submit' });
        
        expect(feedbackInput).toBeInTheDocument();
        expect(submitButton).toBeInTheDocument();
        
        // Example of further testing:
        // fireEvent.change(feedbackInput, { target: { value: 'Great app!' } });
        // fireEvent.click(submitButton);
        // expect(mockSubmitFunction).toHaveBeenCalledWith('Great app!');
    });
}); 