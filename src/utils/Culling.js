import { Matrix4 } from '../datatypes/Matrix4.js';

export class Culling {
    constructor() {
        this.frustumMatrix = new Matrix4();
        this.frustumPlanes = new Float32Array(24);
    }

    updateFrustumPlanes(camera) {
        // Compute view-projection matrix
        this.frustumMatrix.multiply(camera.projectionMatrix, camera.viewMatrix);

        // Extract frustum planes
        const m = this.frustumMatrix.elements;

        // Left plane
        this.frustumPlanes[0] = m[3] + m[0];
        this.frustumPlanes[1] = m[7] + m[4];
        this.frustumPlanes[2] = m[11] + m[8];
        this.frustumPlanes[3] = m[15] + m[12];

        // Right plane
        this.frustumPlanes[4] = m[3] - m[0];
        this.frustumPlanes[5] = m[7] - m[4];
        this.frustumPlanes[6] = m[11] - m[8];
        this.frustumPlanes[7] = m[15] - m[12];

        // Bottom plane
        this.frustumPlanes[8] = m[3] + m[1];
        this.frustumPlanes[9] = m[7] + m[5];
        this.frustumPlanes[10] = m[11] + m[9];
        this.frustumPlanes[11] = m[15] + m[13];

        // Top plane
        this.frustumPlanes[12] = m[3] - m[1];
        this.frustumPlanes[13] = m[7] - m[5];
        this.frustumPlanes[14] = m[11] - m[9];
        this.frustumPlanes[15] = m[15] - m[13];

        // Near plane
        this.frustumPlanes[16] = m[3] + m[2];
        this.frustumPlanes[17] = m[7] + m[6];
        this.frustumPlanes[18] = m[11] + m[10];
        this.frustumPlanes[19] = m[15] + m[14];

        // Far plane
        this.frustumPlanes[20] = m[3] - m[2];
        this.frustumPlanes[21] = m[7] - m[6];
        this.frustumPlanes[22] = m[11] - m[10];
        this.frustumPlanes[23] = m[15] - m[14];

        // Normalize planes (so distance checks are correct)
        for (let p = 0; p < 6; p++) {
            const i = p * 4;
            const nx = this.frustumPlanes[i + 0];
            const ny = this.frustumPlanes[i + 1];
            const nz = this.frustumPlanes[i + 2];
            const invLen = 1.0 / Math.hypot(nx, ny, nz);
            this.frustumPlanes[i + 0] *= invLen;
            this.frustumPlanes[i + 1] *= invLen;
            this.frustumPlanes[i + 2] *= invLen;
            this.frustumPlanes[i + 3] *= invLen;
        }
    }

    isCulled(box) {
        // Use center/half-extent test against normalized planes (faster and robust)
        const cx = (box.min[0] + box.max[0]) * 0.5;
        const cy = (box.min[1] + box.max[1]) * 0.5;
        const cz = (box.min[2] + box.max[2]) * 0.5;
        const ex = (box.max[0] - box.min[0]) * 0.5;
        const ey = (box.max[1] - box.min[1]) * 0.5;
        const ez = (box.max[2] - box.min[2]) * 0.5;

        for (let p = 0; p < 6; p++) {
            const i = p * 4;
            const nx = this.frustumPlanes[i + 0];
            const ny = this.frustumPlanes[i + 1];
            const nz = this.frustumPlanes[i + 2];
            const d = this.frustumPlanes[i + 3];

            // Project half extents onto plane normal
            const r = ex * Math.abs(nx) + ey * Math.abs(ny) + ez * Math.abs(nz);
            const s = nx * cx + ny * cy + nz * cz + d;
            if (s + r < 0) {
                return true; // completely outside this plane
            }
        }
        return false;
    }
}