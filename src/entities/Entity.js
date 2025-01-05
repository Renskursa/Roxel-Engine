export class Entity {
    constructor() {
        this.id = crypto.randomUUID();
        this.components = new Map();
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };
        this.active = true;
        this.parent = null;
        this.children = new Set();
    }

    addComponent(component) {
        component.entity = this;
        this.components.set(component.constructor.name, component);
        component.onAdd?.();
        return component;
    }

    getComponent(componentType) {
        return this.components.get(componentType);
    }

    removeComponent(componentType) {
        const component = this.components.get(componentType);
        if (component) {
            component.onRemove?.();
            this.components.delete(componentType);
        }
    }

    addChild(entity) {
        entity.parent = this;
        this.children.add(entity);
    }

    removeChild(entity) {
        entity.parent = null;
        this.children.delete(entity);
    }

    update(deltaTime) {
        if (!this.active) return;
        
        // Update all components
        for (const component of this.components.values()) {
            component.update?.(deltaTime);
        }

        // Update children
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }

    destroy() {
        // Cleanup components
        for (const component of this.components.values()) {
            component.onRemove?.();
        }
        this.components.clear();

        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Destroy children
        for (const child of this.children) {
            child.destroy();
        }
        this.children.clear();
    }
}
