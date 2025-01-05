export const KeyCode = {
    // Letters
    A: 'KeyA', B: 'KeyB', C: 'KeyC', D: 'KeyD', E: 'KeyE', F: 'KeyF',
    G: 'KeyG', H: 'KeyH', I: 'KeyI', J: 'KeyJ', K: 'KeyK', L: 'KeyL',
    M: 'KeyM', N: 'KeyN', O: 'KeyO', P: 'KeyP', Q: 'KeyQ', R: 'KeyR',
    S: 'KeyS', T: 'KeyT', U: 'KeyU', V: 'KeyV', W: 'KeyW', X: 'KeyX',
    Y: 'KeyY', Z: 'KeyZ',

    // Numbers
    Alpha0: 'Digit0', Alpha1: 'Digit1', Alpha2: 'Digit2', Alpha3: 'Digit3',
    Alpha4: 'Digit4', Alpha5: 'Digit5', Alpha6: 'Digit6', Alpha7: 'Digit7',
    Alpha8: 'Digit8', Alpha9: 'Digit9',

    // Function keys - fix the format to match the actual event.code
    F1: 'F1',
    F2: 'F2', // This needs to match exactly what e.code returns
    F3: 'F3',
    F4: 'F4',
    F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8',
    F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',

    // Special keys
    Space: 'Space',
    LeftControl: 'ControlLeft',
    RightControl: 'ControlRight',
    LeftShift: 'ShiftLeft',
    RightShift: 'ShiftRight',
    LeftAlt: 'AltLeft',
    RightAlt: 'AltRight',
    Enter: 'Enter',
    Escape: 'Escape',
    Tab: 'Tab',

    // Arrow keys
    UpArrow: 'ArrowUp',
    DownArrow: 'ArrowDown',
    LeftArrow: 'ArrowLeft',
    RightArrow: 'ArrowRight',

    // Mouse buttons
    Mouse0: 'MouseButton0',
    Mouse1: 'MouseButton1',
    Mouse2: 'MouseButton2'
};

export const InputAxis = {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
    MouseX: 'mouseX',
    MouseY: 'mouseY',
    MouseScrollWheel: 'mouseScrollWheel'
};
