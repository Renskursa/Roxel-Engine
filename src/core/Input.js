import { KeyCode, InputAxis } from './InputSystem.js';

export class Input {
    constructor() {
        this.actions = new Map();
        this.axisValues = new Map();
        this.currentKeys = new Map();
        this.previousKeys = new Map();
        this.justPressedKeys = new Set();
        this.keysPressedThisFrame = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseMotion = { x: 0, y: 0 };
        this.mouseMoveEvents = [];
        this.mouseWheel = 0;
    }

    initialize() {
        this.setupEventListeners();
        this.setupDefaultInputMap();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown.bind(this), false);
        window.addEventListener('keyup', this.handleKeyUp.bind(this), false);
        
        // Mouse events
        window.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        window.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        window.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
        window.addEventListener('wheel', this.handleMouseWheel.bind(this), { passive: false });
        
        // Context menu
        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    handleKeyDown(e) {
        e.preventDefault();
        if (!this.currentKeys.get(e.code)) {
            this.currentKeys.set(e.code, true);
            this.keysPressedThisFrame.add(e.code);
        }
    }

    handleKeyUp(e) {
        e.preventDefault();
        this.currentKeys.set(e.code, false);
    }

    handleMouseMove(e) {
        e.preventDefault();
        this.mouseMoveEvents.push({
            movementX: e.movementX || 0,
            movementY: e.movementY || 0
        });
    }

    handleMouseDown(e) {
        e.preventDefault();
        const button = `MouseButton${e.button}`;
        if (!this.currentKeys.get(button)) {
            this.currentKeys.set(button, true);
            this.keysPressedThisFrame.add(button);
        }
    }

    handleMouseUp(e) {
        e.preventDefault();
        const button = `MouseButton${e.button}`;
        this.currentKeys.set(button, false);
    }

    handleMouseWheel(e) {
        e.preventDefault();
        this.mouseWheel = -Math.sign(e.deltaY); // Normalize to -1, 0, or 1
    }

    update() {
        // 1. Store previous state
        this.previousKeys = new Map(this.currentKeys);
        
        // 2. Update pressed keys
        this.justPressedKeys = new Set(this.keysPressedThisFrame);
        this.keysPressedThisFrame.clear();
        
        // 3. Process mouse
        this.processMouseMovement();
        
        // 4. Update axes
        this.updateAxes();
    }

    // Core input methods
    getKey(keyCode) { return this.currentKeys.get(keyCode) || false; }
    getKeyDown(keyCode) { return this.justPressedKeys.has(keyCode); }
    getKeyUp(keyCode) { return !this.currentKeys.get(keyCode) && this.previousKeys.get(keyCode); }
    
    // Action methods
    isActionPressed(name) {
        const keys = this.actions.get(name);
        return keys ? keys.some(key => this.getKeyDown(key)) : false;
    }

    isActionHeld(name) {
        const keys = this.actions.get(name);
        return keys ? keys.some(key => this.getKey(key)) : false;
    }

    getAxis(axisName) {
        const axis = this.axisValues.get(axisName);
        return axis ? axis.value : 0;
    }

    getAxisRaw(axisName) {
        const axis = this.axisValues.get(axisName);
        return axis ? Math.sign(axis.value) : 0;
    }

    addAxis(name, positiveKey, negativeKey) {
        this.axisValues.set(name, {
            positive: positiveKey,
            negative: negativeKey,
            value: 0
        });
    }

    updateAxes() {
        for (const [name, axis] of this.axisValues) {
            let value = 0;
            
            // For keyboard input
            if (this.getKey(axis.positive)) value += 1;
            if (this.getKey(axis.negative)) value -= 1;
            
            // For special axes like mouse
            if (name === InputAxis.MouseX) {
                value = this.mouseMotion.x;
            } else if (name === InputAxis.MouseY) {
                value = this.mouseMotion.y;
            } else if (name === InputAxis.MouseScrollWheel) {
                value = this.mouseWheel;
            }
            
            // Update the axis value
            axis.value = value;
        }
    }

    clearActions() {
        this.actions.clear();
        this.axisValues.clear();
    }

    setupDefaultInputMap() {
        // Clear existing bindings
        this.clearActions();

        // Set up Unity-like input axes
        this.addAxis(InputAxis.Horizontal, KeyCode.D, KeyCode.A);
        this.addAxis(InputAxis.Vertical, KeyCode.W, KeyCode.S);
        
        // Add common action mappings
        this.addAction('move_forward', [KeyCode.W, KeyCode.UpArrow]);
        this.addAction('move_backward', [KeyCode.S, KeyCode.DownArrow]);
        this.addAction('move_left', [KeyCode.A, KeyCode.LeftArrow]);
        this.addAction('move_right', [KeyCode.D, KeyCode.RightArrow]);
        this.addAction('jump', [KeyCode.Space]);
        this.addAction('sprint', [KeyCode.LeftShift]);
        this.addAction('crouch', [KeyCode.LeftControl]);
        this.addAction('interact', [KeyCode.E]);
        this.addAction('toggle_vsync', [KeyCode.F2]);
        this.addAction('toggle_wireframe', [KeyCode.F1]);
    }

    processMouseMovement() {
        let totalX = 0, totalY = 0;
        this.mouseMoveEvents.forEach(event => {
            totalX += event.movementX;
            totalY += event.movementY;
        });
        
        this.mouseMotion = {
            x: Math.min(Math.max(totalX, -100), 100),
            y: Math.min(Math.max(totalY, -100), 100)
        };
        this.mouseMoveEvents = [];
    }

    addAction(name, keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        this.actions.set(name, keys);
    }

    getMouseMotion() {
        // Return and reset mouse motion in one go
        const motion = { 
            x: this.mouseMotion.x,
            y: this.mouseMotion.y
        };
        // Reset after reading to prevent motion from persisting
        this.mouseMotion = { x: 0, y: 0 };
        return motion;
    }

    getMouseWheelDelta() {
        const value = this.mouseWheel;
        this.mouseWheel = 0; // Reset after reading
        return value;
    }
}