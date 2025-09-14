import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListStylesTest from './ListStylesTest';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

// Mock html-to-docx
jest.mock('html-to-docx', () => {
  return jest.fn(() => Promise.resolve(new ArrayBuffer(8)));
});

describe('ListStylesTest Component', () => {
  test('renders list styles test component', () => {
    render(<ListStylesTest />);
    
    expect(screen.getByText('List Styles Test')).toBeInTheDocument();
    expect(screen.getByText(/Test list style inheritance edge cases/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate List Styles Test Document/i })).toBeInTheDocument();
  });

  test('generates document when button is clicked', async () => {
    const { saveAs } = require('file-saver');
    const HTMLtoDOCX = require('html-to-docx');
    
    render(<ListStylesTest />);
    
    const button = screen.getByRole('button', { name: /Generate List Styles Test Document/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(HTMLtoDOCX).toHaveBeenCalledWith(
        expect.stringContaining('List Style Inheritance Edge Cases'),
        null,
        expect.objectContaining({
          orientation: 'portrait',
          title: 'List Edge Cases Test'
        })
      );
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'list-styles-test.docx'
      );
    });
  });

  test('handles error during document generation', async () => {
    const HTMLtoDOCX = require('html-to-docx');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    HTMLtoDOCX.mockRejectedValueOnce(new Error('Test error'));
    
    render(<ListStylesTest />);
    
    const button = screen.getByRole('button', { name: /Generate List Styles Test Document/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error in list styles test:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});