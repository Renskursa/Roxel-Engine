import { Camera, CameraControlMode } from '../core/Camera.js';
import { Vector3 } from '../datatypes/Vector3.js';

export class CameraComponent {
    constructor() {
        this.entity = null;
        this.camera = new Camera();
        this.offset = new Vector3(0, 2, -5);
        this.camera.setControlMode(CameraControlMode.FOLLOW);
    }

    update(deltaTime) {
        if (!this.entity || this.camera.controlMode !== CameraControlMode.FOLLOW) return;

        const pos = this.entity.position;
        const rot = this.entity.rotation;

        // Calculate rotated offset
        const rotatedOffset = new Vector3(this.offset.x, this.offset.y, this.offset.z);
        rotatedOffset.rotateAroundY(rot.y);

        // Update camera position
        const cameraPos = new Vector3(
            pos.x + rotatedOffset.x,
            pos.y + rotatedOffset.y,
            pos.z + rotatedOffset.z
        );

        // Set camera position and update based on mode
        this.camera.position.copy(cameraPos);
        this.camera.rotation.copy(rot);
        this.camera.updateViewMatrix();
    }

    setOffset(x, y, z) {
        this.offset.set(x, y, z);
    }
}
