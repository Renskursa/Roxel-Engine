export class Scene {
    constructor() {
        this.children = [];
        this.voxels = [];
        this.engine = null;
    }

    add(object) {
        if (object.generateRenderData) {
            if (!this.voxels.includes(object)) {
                this.voxels.push(object);
                return true;
            }
        } else if (!this.children.includes(object)) {
            this.children.push(object);
            return true;
        }
        return false;
    }

    remove(object) {
        const childIndex = this.children.indexOf(object);
        const voxelIndex = this.voxels.indexOf(object);
        
        if (childIndex !== -1) {
            this.children.splice(childIndex, 1);
        }
        if (voxelIndex !== -1) {
            this.voxels.splice(voxelIndex, 1);
        }
    }

    clear() {
        this.children = [];
        this.voxels = [];
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
        
        // Update voxels that need regeneration
        this.voxels.forEach(voxel => {
            if (voxel && voxel._isDirty) {
                voxel.generateRenderData();
            }
        });
    }

    generateRenderData() {
        return {
            children: this.children,
            voxels: this.voxels
        };
    }
}