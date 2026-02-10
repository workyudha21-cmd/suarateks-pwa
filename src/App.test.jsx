import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi } from 'vitest';

// Mock Web Speech API
const mockSpeechRecognition = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
window.SpeechRecognition = mockSpeechRecognition;
window.webkitSpeechRecognition = mockSpeechRecognition;

// Mock wakeLock
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue({
      release: vi.fn(),
    }),
  },
});

describe('App', () => {
  it('renders the title', () => {
    render(<App />);
    expect(screen.getByText(/SuaraTeks/i)).toBeInTheDocument();
  });

  it('shows start button initially', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Mulai/i })).toBeInTheDocument();
  });
});
