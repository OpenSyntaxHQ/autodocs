import '@testing-library/jest-dom/vitest';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserver;
}

const htmlElementPrototype = window.HTMLElement.prototype as Partial<HTMLElement>;
if (typeof htmlElementPrototype.scrollIntoView !== 'function') {
  htmlElementPrototype.scrollIntoView = () => undefined;
}

const windowWithOptionalMatchMedia = window as Window & {
  matchMedia?: Window['matchMedia'];
};
if (typeof windowWithOptionalMatchMedia.matchMedia !== 'function') {
  windowWithOptionalMatchMedia.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}
