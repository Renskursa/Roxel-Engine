import { World } from '../core/World.js';

export class Scene {
    constructor() {
        this.children = [];
        this.world = new World();
        this.textures = new Map();
        this.engine = null;
    }

    add(object) {
        if (!this.children.includes(object)) {
            this.children.push(object);
            return true;
        }
        return false;
    }

    remove(object) {
        const childIndex = this.children.indexOf(object);
        if (childIndex !== -1) {
            this.children.splice(childIndex, 1);
        }
    }

    clear() {
        this.children = [];
        this.world = new World();
        this.textures.clear();
    }

    // Scene-specific lifecycle methods only
    async onSceneLoad() {}

    async onSceneUnload() {
        this.clear();
    }

    onSceneStart() {}

    onSceneEnd() {}

    update(deltaTime) {
        // Update all game objects in the scene
        this.children.forEach(obj => {
            if (obj.update) obj.update(deltaTime);
        });

        // Update world, e.g. for dynamic chunk loading
        if (this.world?.update) {
            this.world.update(deltaTime);
        }
    }

    addTexture(name, texture) {
        this.textures.set(name, texture);
    }

    getTexture(name) {
        return this.textures.get(name);
    }
}