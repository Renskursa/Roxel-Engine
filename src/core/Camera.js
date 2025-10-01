import { vec3 } from 'gl-matrix';
import { Matrix4 } from '../datatypes/Matrix4.js';
import { Vector3 } from '../datatypes/Vector3.js';

export const CameraControlMode = {
    FREE: 'free',      // Direct control of position and rotation
    FOLLOW: 'follow',  // Follows target with offset
    LOOKAT: 'lookat'   // Always looks at a target point
};

export class Camera {
    constructor() {
        this.position = new Vector3(0, 0, -10);
        this.target = new Vector3(0, 0, 0);  // Make sure it's a Vector3
        this.up = new Vector3(0, 1, 0);      // Make sure it's a Vector3
        this.rotation = new Vector3(0, 0, 0); // Add rotation vector
        this.forward = new Vector3(0, 0, -1);
        
        this.fov = Math.PI / 4;
        this.aspect = 1;
        this.near = 0.1;
        this.far = 1000;

        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();
        
        // Initialize matrices
        this.updateProjectionMatrix();
        this.updateViewMatrix();

        this.controlMode = CameraControlMode.FREE;
        this.targetPosition = new Vector3(0, 0, 0);
    }

    setPerspective(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.updateProjectionMatrix();
    }

    updateAspectRatio(aspect) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix.perspective(this.fov, this.aspect, this.near, this.far);
    }

    updateViewMatrix() {
        if (this.controlMode === CameraControlMode.LOOKAT) {
            this.viewMatrix.lookAt(this.position, this.targetPosition, this.up);
        } else if (this.controlMode === CameraControlMode.FREE) {
            const lookAtTarget = this.position.clone().add(this.forward);
            this.viewMatrix.lookAt(this.position, lookAtTarget, this.up);
        }
    }

    update() {
        this.updateViewMatrix();
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.updateViewMatrix();
        return this;
    }

    getForwardVector() {
        return this.forward.clone();
    }

    getRightVector() {
        // Fix right vector calculation
        const forward = this.getForwardVector();
        return Vector3.cross(forward, this.up).normalize();
    }

    getForwardVectorGLM() {
        return vec3.fromValues(this.forward.x, this.forward.y, this.forward.z);
    }

    getRightVectorGLM() {
        const forward = this.getForwardVectorGLM();
        const up = vec3.fromValues(this.up.x, this.up.y, this.up.z);
        const right = vec3.create();
        vec3.cross(right, forward, up);
        vec3.normalize(right, right);
        return right;
    }

    lookAt(x, y, z) {
        this.targetPosition.set(x, y, z);
        this.controlMode = CameraControlMode.LOOKAT;

        // Update rotation based on lookAt target
        const direction = this.targetPosition.clone().subtract(this.position).normalize();
        this.rotation.y = Math.atan2(direction.x, -direction.z);
        this.rotation.x = Math.asin(direction.y);

        // Recalculate forward vector from new rotation
        this.forward.x = Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
        this.forward.y = Math.sin(this.rotation.x);
        this.forward.z = -Math.cos(this.rotation.y) * Math.cos(this.rotation.x);
        this.forward.normalize();

        this.updateViewMatrix();
        return this;
    }

    rotate(yawDelta, pitchDelta) {
        // Yaw rotates right for positive values, left for negative
        this.rotation.y = (this.rotation.y + Number(yawDelta)) % (Math.PI * 2);
        
        // Pitch rotates up for positive values, down for negative
        const maxPitch = (Math.PI / 2) * 0.999;
        this.rotation.x = Math.max(
            Math.min(
                this.rotation.x - Number(pitchDelta),
                maxPitch
            ),
            -maxPitch
        );

        // Recalculate forward vector
        this.forward.x = Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
        this.forward.y = Math.sin(this.rotation.x);
        this.forward.z = -Math.cos(this.rotation.y) * Math.cos(this.rotation.x);
        this.forward.normalize();
    }

    move(x, y, z) {
        // Ensure we're working with numbers
        const dx = Number(x) || 0;
        const dy = Number(y) || 0;
        const dz = Number(z) || 0;

        // Update position using Vector3 methods properly
        const movement = new Vector3(dx, dy, dz);
        this.position.add(movement);

        // Update target using same movement
        this.targetPosition.add(movement);

        this.updateViewMatrix();
    }

    setControlMode(mode) {
        this.controlMode = mode;
        return this;
    }

    // New method for direct rotation control
    setRotation(x, y, z) {
        if (this.controlMode === CameraControlMode.FREE) {
            this.rotation.set(x, y, z);
            this.updateViewMatrix();
        }
        return this;
    }
}
