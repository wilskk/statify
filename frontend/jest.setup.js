import '@testing-library/jest-dom';

class PointerEvent extends Event {
    constructor(type, params) {
        super(type, params);
        if (params) {
            this.pointerId = params.pointerId;
        }
    }
}
global.PointerEvent = PointerEvent;

// Mock for hasPointerCapture and other pointer events
if (global.Element && !global.Element.prototype.hasPointerCapture) {
  global.Element.prototype.hasPointerCapture = (pointerId) => false;
}
if (global.Element && !global.Element.prototype.releasePointerCapture) {
  global.Element.prototype.releasePointerCapture = (pointerId) => {};
}
if (global.Element && !global.Element.prototype.setPointerCapture) {
    global.Element.prototype.setPointerCapture = (pointerId) => {};
}

if (global.Element && !global.Element.prototype.scrollIntoView) {
    global.Element.prototype.scrollIntoView = () => {};
} 