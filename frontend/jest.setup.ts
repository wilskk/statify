import 'fake-indexeddb/auto';
// Optional: learn more about extending Jest matchers at
// https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
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