import { Matrix4 } from '../datatypes/Matrix4.js';

export class Light {
    constructor(type = 'directional') {
        this.type = type;
        this.position = { x: 0, y: 1, z: 0 };
        this.direction = { x: 0, y: -1, z: 0 };
        this.color = [1.0, 1.0, 1.0];
        this.intensity = 1.0;
        this.shadowMap = null;
        this.shadowMatrix = new Matrix4();
        this.shadowProjection = new Matrix4();
        this.shadowViewMatrix = new Matrix4();
    }

    setShadowProjection(left, right, bottom, top, near, far) {
        this.shadowProjection.ortho(left, right, bottom, top, near, far);
        this.updateShadowMatrix();
    }

    updateShadowMatrix() {
        this.shadowViewMatrix.lookAt(
            this.position,
            {
                x: this.position.x + this.direction.x,
                y: this.position.y + this.direction.y,
                z: this.position.z + this.direction.z
            },
            { x: 0, y: 1, z: 0 }
        );
        
        this.shadowMatrix
            .copy(this.shadowProjection)
            .multiply(this.shadowViewMatrix);
    }
}

export class LightingSystem {
    constructor() {
        this.lights = [];
        this.ambientLight = { color: [0.2, 0.2, 0.2], intensity: 0.2 };
    }

    addLight(light) {
        this.lights.push(light);
    }

    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index !== -1) {
            this.lights.splice(index, 1);
        }
    }

    setAmbientLight(color, intensity) {
        this.ambientLight.color = color;
        this.ambientLight.intensity = intensity;
    }
}
