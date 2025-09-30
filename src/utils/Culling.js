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
    }

    isCulled(box) {
        const corners = [
            [box.min[0], box.min[1], box.min[2]],
            [box.max[0], box.min[1], box.min[2]],
            [box.min[0], box.max[1], box.min[2]],
            [box.max[0], box.max[1], box.min[2]],
            [box.min[0], box.min[1], box.max[2]],
            [box.max[0], box.min[1], box.max[2]],
            [box.min[0], box.max[1], box.max[2]],
            [box.max[0], box.max[1], box.max[2]],
        ];

        // For each plane...
        for (let p = 0; p < 6; p++) {
            let allCornersOutside = true;
            // ...check if all corners are outside.
            for (let c = 0; c < 8; c++) {
                const distance =
                    this.frustumPlanes[p * 4 + 0] * corners[c][0] +
                    this.frustumPlanes[p * 4 + 1] * corners[c][1] +
                    this.frustumPlanes[p * 4 + 2] * corners[c][2] +
                    this.frustumPlanes[p * 4 + 3];
                if (distance >= 0) {
                    // This corner is inside or on the plane, so the box is not fully outside this plane.
                    allCornersOutside = false;
                    break;
                }
            }
            if (allCornersOutside) {
                // All corners were outside this plane, so the entire box is outside the frustum.
                return true;
            }
        }

        return false; // The box is at least partially inside the frustum.
    }
}