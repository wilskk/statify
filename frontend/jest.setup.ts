import 'fake-indexeddb/auto';
// Optional: learn more about extending Jest matchers at
// https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util';
import './public/workers/DescriptiveStatistics/libs/utils/utils';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Polyfill for PointerEvent which is not implemented in JSDOM
if (!global.PointerEvent) {
    class PointerEvent extends Event {
        pointerId: number;
        constructor(type: string, params: PointerEventInit) {
            super(type, params);
            this.pointerId = params.pointerId as number;
        }
    }
    global.PointerEvent = PointerEvent as any;
}

// Mock for hasPointerCapture and other pointer events which are not implemented in JSDOM
if (global.Element && !global.Element.prototype.hasPointerCapture) {
    global.Element.prototype.hasPointerCapture = (pointerId: number): boolean => false;
}
if (global.Element && !global.Element.prototype.releasePointerCapture) {
    global.Element.prototype.releasePointerCapture = (pointerId: number): void => {};
}
if (global.Element && !global.Element.prototype.setPointerCapture) {
    global.Element.prototype.setPointerCapture = (pointerId: number): void => {};
}

// Mock for scrollIntoView
if (global.Element && !global.Element.prototype.scrollIntoView) {
    global.Element.prototype.scrollIntoView = (): void => {};
}

// Lightweight mocks for heavy UI libraries used across many test suites.
// These reduce memory usage and speed-up test execution by avoiding the full implementation.

// Mock lucide-react: return every requested icon as a simple <svg /> placeholder.
jest.mock('lucide-react', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (_, iconName) =>
        React.forwardRef((props: any, ref: any) =>
          React.createElement('svg', { ref, 'data-icon': iconName, ...props })
        ),
    }
  );
});

// Mock framer-motion: map all motion components to plain <div>s and make AnimatePresence a passthrough.
jest.mock('framer-motion', () => {
  const React = require('react');
  const handler = {
    get: () =>
      React.forwardRef((props: any, ref: any) =>
        React.createElement('div', { ref, ...props }, props.children)
      ),
  };

  const motionProxy = new Proxy({}, handler);

  return {
    __esModule: true,
    ...React,
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

// Polyfill for ResizeObserver which is not implemented in JSDOM
if (!(global as any).ResizeObserver) {
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock Radix-UI Dialog primitives with a Proxy so any component (Overlay, Content, etc.) is mapped
// to a lightweight <div>. This prevents undefined property errors when the wrapper `ui/dialog`
// references internal Radix fields like `Overlay` or `Content`.
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react');
  const Primitive = React.forwardRef((props: any, ref: any) =>
    React.createElement('div', { ref, ...props }, props.children)
  );

  // base object with explicit members typically used
  const base: Record<string, any> = {
    __esModule: true,
    default: Primitive,
    Root: Primitive,
    Trigger: Primitive,
    Portal: Primitive,
    Close: Primitive,
  };

  // proxy to supply any other property (Overlay, Content, Title, Description, etc.) on demand
  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return (target as any)[prop];
      // Lazily assign to preserve reference equality across calls
      return Primitive;
    },
  });
});