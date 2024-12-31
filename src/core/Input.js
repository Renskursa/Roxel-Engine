export class Input {
    static #actions = new Map();
    static #axisValues = new Map();
    static #currentKeys = new Map();
    static #previousKeys = new Map();
    static #justPressedKeys = new Set();
    
    static #mousePosition = { x: 0, y: 0 };
    static #mouseMotion = { x: 0, y: 0 };
    static #mouseWheel = 0;
    
    static MOUSE_BUTTON_LEFT = 1;
    static MOUSE_BUTTON_RIGHT = 2;
    static MOUSE_BUTTON_MIDDLE = 3;
    
    static initialize() {
        this.#actions.clear();
        this.#currentKeys.clear();
        this.#previousKeys.clear();
        this.#justPressedKeys.clear();

        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            if (!this.#currentKeys.get(e.code)) {
                this.#currentKeys.set(e.code, true);
                this.#justPressedKeys.add(e.code);
            }
        });

        window.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.#currentKeys.set(e.code, false);
        });

        window.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.#mousePosition = { x: e.clientX, y: e.clientY };
            this.#mouseMotion.x += e.movementX || 0;
            this.#mouseMotion.y += e.movementY || 0;
        });

        window.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const button = `MouseButton${e.button}`;
            this.#currentKeys.set(button, true);
        });

        window.addEventListener('mouseup', (e) => {
            e.preventDefault();
            const button = `MouseButton${e.button}`;
            this.#currentKeys.set(button, false);
        });

        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.#mouseWheel += e.deltaY;
        }, { passive: false });

        this.setupDefaultBindings();
    }

    static update() {
        this.#previousKeys = new Map(this.#currentKeys);
        this.#justPressedKeys.clear();
    }

    static isPressed(input) {
        return this.#currentKeys.get(input) || false;
    }

    static isJustPressed(input) {
        return this.#justPressedKeys.has(input);
    }

    static isJustReleased(input) {
        return !this.#currentKeys.get(input) && this.#previousKeys.get(input);
    }

    static addAction(name, inputs) {
        this.#actions.set(name, inputs);
    }

    static addAxis(name, positiveAction, negativeAction) {
        this.#axisValues.set(name, { positive: positiveAction, negative: negativeAction });
    }

    static clearActions() {
        this.#actions.clear();
        this.#axisValues.clear();
    }

    static isActionPressed(action) {
        const inputs = this.#actions.get(action);
        if (!inputs) return false;
        return inputs.some(input => this.isJustPressed(input));
    }

    static isActionHeld(action) {
        const inputs = this.#actions.get(action);
        if (!inputs) return false;
        return inputs.some(input => this.isPressed(input));
    }

    static isActionReleased(action) {
        const inputs = this.#actions.get(action);
        if (!inputs) return false;
        return inputs.some(input => this.isJustReleased(input));
    }

    static getMousePosition() {
        return { ...this.#mousePosition };
    }

    static getMouseMotion() {
        const motion = { ...this.#mouseMotion };
        this.#mouseMotion = { x: 0, y: 0 };
        return motion;
    }

    static getMouseWheelDelta() {
        const delta = this.#mouseWheel;
        this.#mouseWheel = 0;
        return delta;
    }

    static getAxisValue(axisName) {
        const axis = this.#axisValues.get(axisName);
        if (!axis) return 0;
        
        let value = 0;
        if (this.isActionHeld(axis.positive)) value += 1;
        if (this.isActionHeld(axis.negative)) value -= 1;
        return value;
    }

    static setupDefaultBindings() {
        this.addAction('move_forward', ['KeyW', 'ArrowUp']);
        this.addAction('move_backward', ['KeyS', 'ArrowDown']);
        this.addAction('move_left', ['KeyA', 'ArrowLeft']);
        this.addAction('move_right', ['KeyD', 'ArrowRight']);
        this.addAction('jump', ['Space']);
        this.addAction('crouch', ['ControlLeft']);
        this.addAction('sprint', ['ShiftLeft']);

        this.addAxis('vertical', 'move_forward', 'move_backward');
        this.addAxis('horizontal', 'move_right', 'move_left');
    }
}