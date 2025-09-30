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
        } else {
            // Manual rotation and position for FREE mode
            const cosx = Math.cos(this.rotation.x);
            const cosy = Math.cos(this.rotation.y);
            const cosz = Math.cos(this.rotation.z);
            const sinx = Math.sin(this.rotation.x);
            const siny = Math.sin(this.rotation.y);
            const sinz = Math.sin(this.rotation.z);

            this.viewMatrix.identity();

            // Apply rotations
            this.viewMatrix.elements[0] = cosy * cosz;
            this.viewMatrix.elements[1] = sinx * siny * cosz - cosx * sinz;
            this.viewMatrix.elements[2] = cosx * siny * cosz + sinx * sinz;
            this.viewMatrix.elements[4] = cosy * sinz;
            this.viewMatrix.elements[5] = sinx * siny * sinz + cosx * cosz;
            this.viewMatrix.elements[6] = cosx * siny * sinz - sinx * cosz;
            this.viewMatrix.elements[8] = -siny;
            this.viewMatrix.elements[9] = sinx * cosy;
            this.viewMatrix.elements[10] = cosx * cosy;

            // Apply translation
            this.viewMatrix.elements[12] = -(this.position.x * this.viewMatrix.elements[0] + 
                                          this.position.y * this.viewMatrix.elements[4] + 
                                          this.position.z * this.viewMatrix.elements[8]);
            this.viewMatrix.elements[13] = -(this.position.x * this.viewMatrix.elements[1] + 
                                          this.position.y * this.viewMatrix.elements[5] + 
                                          this.position.z * this.viewMatrix.elements[9]);
            this.viewMatrix.elements[14] = -(this.position.x * this.viewMatrix.elements[2] + 
                                          this.position.y * this.viewMatrix.elements[6] + 
                                          this.position.z * this.viewMatrix.elements[10]);
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

    getForwardVector(out = null) {
        const result = out || new Vector3();
        result.set(
            Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
            Math.sin(this.rotation.x),
            Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
        );
        return result.normalize();
    }

    getRightVector(out = null) {
        const result = out || new Vector3();
        const forward = this.getForwardVector();
        Vector3.cross(forward, this.up, result);
        return result.normalize();
    }

    lookAt(x, y, z) {
        this.targetPosition.set(x, y, z);
        this.controlMode = CameraControlMode.LOOKAT;
        this.viewMatrix.lookAt(this.position, this.targetPosition, this.up);
        return this;
    }

    rotate(yawDelta, pitchDelta) {
        // Yaw rotates right for positive values, left for negative
        this.rotation.y = (this.rotation.y - Number(yawDelta)) % (Math.PI * 2);
        
        // Pitch rotates up for positive values, down for negative
        const maxPitch = (Math.PI / 2) * 0.999;
        this.rotation.x = Math.max(
            Math.min(
                this.rotation.x - Number(pitchDelta),
                maxPitch
            ),
            -maxPitch
        );

        // Update target using forward vector
        const forward = this.getForwardVector();
        this.target.copy(this.position).add(forward);
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
        this.target.add(movement);

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
