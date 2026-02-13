// Test Setup — Vitest + React Testing Library
import '@testing-library/jest-dom';

// localStorage mock
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = String(value); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// window.alert mock
window.alert = vi.fn();
window.confirm = vi.fn(() => true);
