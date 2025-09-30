/**
 * @class Component
 * @description Base class for all components in the Roxel engine.
 * @property {GameObject} gameObject - The game object this component is attached to.
 */
export class Component {
    constructor() {
        this.gameObject = null;
    }

    /**
     * @method awake
     * @description Called when the component is first created.
     */
    awake() {}

    /**
     * @method start
     * @description Called before the first frame update.
     */
    start() {}

    /**
     * @method earlyUpdate
     * @description Called every frame, before the main update.
     * @param {number} deltaTime - The time since the last frame.
     */
    earlyUpdate(deltaTime) {}

    /**
     * @method fixedUpdate
     * @description Called at a fixed time interval, for physics calculations.
     * @param {number} deltaTime - The fixed time step.
     */
    fixedUpdate(deltaTime) {}

    /**
     * @method update
     * @description Called every frame.
     * @param {number} deltaTime - The time since the last frame.
     */
    update(deltaTime) {}

    /**
     * @method lateUpdate
     * @description Called every frame, after the main update.
     * @param {number} deltaTime - The time since the last frame.
     */
    lateUpdate(deltaTime) {}

    /**
     * @method onDestroy
     * @description Called when the component is destroyed.
     */
    onDestroy() {}

    /**
     * @method onEnable
     * @description Called when the component is enabled.
     */
    onEnable() {}

    /**
     * @method onDisable
     * @description Called when the component is disabled.
     */
    onDisable() {}

    /**
     * @method onCollision
     * @description Called when a collision occurs.
     * @param {Collision} collision - The collision data.
     */
    onCollision(collision) {}

    /**
     * @method onTrigger
     * @description Called when a trigger event occurs.
     * @param {Collider} other - The other collider involved in the trigger.
     */
    onTrigger(other) {}

    /**
     * @method onResize
     * @description Called when the canvas is resized.
     * @param {number} width - The new width of the canvas.
     * @param {number} height - The new height of the canvas.
     */
    onResize(width, height) {}
}