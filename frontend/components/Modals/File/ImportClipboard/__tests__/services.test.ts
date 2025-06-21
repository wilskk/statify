import { readTextFromClipboard } from '../services/services';

describe('readTextFromClipboard service', () => {
  const mockReadText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the global navigator.clipboard object
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        readText: mockReadText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    // Clean up the mock after all tests are done
     Object.defineProperty(global.navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('should resolve with text from clipboard on success', async () => {
    const clipboardText = 'hello\tworld';
    mockReadText.mockResolvedValue(clipboardText);

    await expect(readTextFromClipboard()).resolves.toBe(clipboardText);
    expect(mockReadText).toHaveBeenCalledTimes(1);
  });

  it('should reject if clipboard API is not available', async () => {
    // Temporarily remove the clipboard API for this test
    Object.defineProperty(global.navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
    });
    await expect(readTextFromClipboard()).rejects.toThrow('Clipboard API not available.');
  });
  
  it('should reject if clipboard is empty', async () => {
    mockReadText.mockResolvedValue('');
    await expect(readTextFromClipboard()).rejects.toThrow('Clipboard is empty or contains non-text data.');
  });

  it('should reject when readText throws an error (e.g., permission denied)', async () => {
    const error = new Error('Permission denied');
    mockReadText.mockRejectedValue(error);
    await expect(readTextFromClipboard()).rejects.toThrow('Could not read from clipboard. Permission might be denied or an unexpected error occurred.');
  });
}); 