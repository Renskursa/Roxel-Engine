import { Matrix4 } from '../datatypes/Matrix4.js';
import { Vector3 } from '../datatypes/Vector3.js';

export class Camera {
    constructor() {
        this.position = { x: 0, y: 0, z: 0 };
        this.target = { x: 0, y: 0, z: -1 };
        this.up = { x: 0, y: 1, z: 0 };
        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;
        this.fov = Math.PI / 3;
        this.aspect = 1;
        this.near = 0.1;
        this.far = 1000.0;
        this._viewMatrix = new Matrix4();
        this._projectionMatrix = new Matrix4();
        this._viewProjectionMatrix = new Matrix4();
        this._dirty = {
            view: true,
            projection: true,
            viewProjection: true
        };
        this.minPitch = -Math.PI / 2 + 0.1;
        this.maxPitch = Math.PI / 2 - 0.1;
        this.updateProjection();
    }

    setPerspective(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this._dirty.projection = true;
        this._dirty.viewProjection = true;
        this.updateProjection();
    }

    rotate(deltaYaw, deltaPitch) {
        this.yaw = (this.yaw + deltaYaw) % (Math.PI * 2);
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + deltaPitch));
        this._dirty.view = true;
        this._dirty.viewProjection = true;
        this.updateViewMatrix();
    }

    lookAt(target) {
        this.target.x = target.x;
        this.target.y = target.y;
        this.target.z = target.z;
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const dz = target.z - this.position.z;
        this.yaw = Math.atan2(dx, dz);
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        this.pitch = -Math.atan2(dy, horizontalDistance);
        this._dirty.view = true;
        this._dirty.viewProjection = true;
        this.updateViewMatrix();
    }

    getForwardVector() {
        return {
            x: -Math.sin(this.yaw) * Math.cos(this.pitch),
            y: -Math.sin(this.pitch),
            z: -Math.cos(this.yaw) * Math.cos(this.pitch)
        };
    }

    getRightVector() {
        return {
            x: Math.cos(this.yaw),
            y: 0,
            z: -Math.sin(this.yaw)
        };
    }

    getUpVector() {
        const forward = this.getForwardVector();
        const right = this.getRightVector();
        return {
            x: forward.z * right.y - forward.y * right.z,
            y: forward.x * right.z - forward.z * right.x,
            z: forward.y * right.x - forward.x * right.y
        };
    }

    updateViewMatrix() {
        if (!this._dirty.view) return;
        const forward = this.getForwardVector();
        const right = this.getRightVector();
        const up = this.getUpVector();
        this._viewMatrix.elements = new Float32Array([
            right.x, up.x, forward.x, 0,
            right.y, up.y, forward.y, 0,
            right.z, up.z, forward.z, 0,
            -(right.x * this.position.x + right.y * this.position.y + right.z * this.position.z),
            -(up.x * this.position.x + up.y * this.position.y + up.z * this.position.z),
            -(forward.x * this.position.x + forward.y * this.position.y + forward.z * this.position.z),
            1
        ]);
        this._dirty.view = false;
        this._dirty.viewProjection = true;
    }

    updateProjection() {
        if (!this._dirty.projection) return;
        this._projectionMatrix.perspective(this.fov, this.aspect, this.near, this.far);
        this._dirty.projection = false;
        this._dirty.viewProjection = true;
    }

    getViewProjectionMatrix() {
        if (this._dirty.viewProjection) {
            if (this._dirty.view) this.updateViewMatrix();
            if (this._dirty.projection) this.updateProjection();
            this._viewProjectionMatrix = Matrix4.multiply(this._projectionMatrix, this._viewMatrix);
            this._dirty.viewProjection = false;
        }
        return this._viewProjectionMatrix;
    }

    getViewMatrix() {
        if (this._dirty.view) this.updateViewMatrix();
        return this._viewMatrix;
    }

    getProjectionMatrix() {
        if (this._dirty.projection) this.updateProjection();
        return this._projectionMatrix;
    }

    getFrustumPlanes() {
        const m = this.getViewProjectionMatrix().elements;
        return {
            left: { normal: new Vector3(m[3] + m[0], m[7] + m[4], m[11] + m[8]).normalize() },
            right: { normal: new Vector3(m[3] - m[0], m[7] - m[4], m[11] - m[8]).normalize() },
            bottom: { normal: new Vector3(m[3] + m[1], m[7] + m[5], m[11] + m[9]).normalize() },
            top: { normal: new Vector3(m[3] - m[1], m[7] - m[5], m[11] - m[9]).normalize() },
            near: { normal: new Vector3(m[3] + m[2], m[7] + m[6], m[11] + m[10]).normalize() },
            far: { normal: new Vector3(m[3] - m[2], m[7] - m[6], m[11] - m[10]).normalize() }
        };
    }

    move(dx, dy, dz) {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        this._dirty.view = true;
        this._dirty.viewProjection = true;
    }
}
