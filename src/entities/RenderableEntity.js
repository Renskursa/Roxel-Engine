export class RenderableEntity {
    constructor() {
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };
        this.mesh = null;
        this.material = null;
    }

    setMesh(mesh) {
        this.mesh = mesh;
    }

    setMaterial(material) {
        this.material = material;
    }
}