export class Scene {
    constructor() {
        this.children = [];
        this.objects = [];
        this.engine = null;
    }

    add(object) {
        if (!this.children.includes(object)) {
            this.children.push(object);
            this.objects.push(object);
            return true;
        }
        return false;
    }

    remove(object) {
        const childIndex = this.children.indexOf(object);
        const objectIndex = this.objects.indexOf(object);
        
        if (childIndex !== -1) {
            this.children.splice(childIndex, 1);
        }
        if (objectIndex !== -1) {
            this.objects.splice(objectIndex, 1);
        }
    }

    clear() {
        this.children = [];
        this.objects = [];
    }

    async load() {
    }

    async unload() {
        this.clear();
    }

    awake() {
    }

    update() {
    }
}