export class RenderableComponent {
    constructor() {
        this.entity = null;
        this.visible = true;
        this._isDirty = true;
        this.material = null;
    }

    update(deltaTime) {
        if (this.visible && this._isDirty) {
            this.updateRenderData();
            this._isDirty = false;
        }
    }

    updateRenderData() {
        // Override in child classes
    }

    generateRenderData() {
        // Override in child classes
        return null;
    }

    onAdd() {
        // Called when component is added to an entity
    }

    onRemove() {
        // Called when component is removed from an entity
    }

    // Add position helpers that use the parent entity
    get position() {
        return this.entity?.position || { x: 0, y: 0, z: 0 };
    }

    get rotation() {
        return this.entity?.rotation || { x: 0, y: 0, z: 0 };
    }

    get scale() {
        return this.entity?.scale || { x: 1, y: 1, z: 1 };
    }
}
