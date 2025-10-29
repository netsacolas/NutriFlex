import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Provide noop implementations for browser APIs used nos components.
const scrollIntoViewMock = vi.fn();
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: scrollIntoViewMock,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

if (typeof globalThis.Notification === 'undefined') {
  class NotificationMock {
    static permission = 'granted';
    static requestPermission = vi.fn(async () => 'granted');
    constructor() {}
  }

  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    value: NotificationMock,
  });
} else {
  vi.spyOn(globalThis.Notification, 'requestPermission').mockResolvedValue('granted');
}
