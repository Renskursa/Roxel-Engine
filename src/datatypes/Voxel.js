import { Color } from '../utils/ColorUtils';

/**
 * Represents a single voxel (volumetric pixel) in a 3D space
 */
export class Voxel {
    // Static face definitions for rendering
    static VERTICES = {
        front: [0,0,1, 1,0,1, 1,1,1, 0,1,1],
        back: [0,0,0, 0,1,0, 1,1,0, 1,0,0],
        top: [0,1,0, 0,1,1, 1,1,1, 1,1,0],
        bottom: [0,0,0, 1,0,0, 1,0,1, 0,0,1],
        right: [1,0,0, 1,1,0, 1,1,1, 1,0,1],
        left: [0,0,0, 0,0,1, 0,1,1, 0,1,0]
    };

    static INDICES = {
        front: [0,1,2, 0,2,3],
        back: [0,1,2, 0,2,3],
        top: [0,1,2, 0,2,3],
        bottom: [0,1,2, 0,2,3],
        right: [0,1,2, 0,2,3],
        left: [0,1,2, 0,2,3]
    };

    /**
     * @param {number} x - X position in world space
     * @param {number} y - Y position in world space
     * @param {number} z - Z position in world space
     * @param {number} type - Type ID of the voxel
     * @param {object} properties - Optional properties for the voxel
     */
    constructor(x, y, z, type, properties = null) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);
        this.type = type;
        this.properties = properties;
        
        // Rendering properties
        this.visible = true;
        this.color = new Color(1, 1, 1, 1);
        this.visibleFaces = {
            front: true,
            back: true,
            top: true,
            bottom: true,
            right: true,
            left: true
        };
        
        // Buffer data
        this.vertices = null;
        this.indices = null;
        this._isDirty = true;
    }

    setColor(r, g, b, a = 1.0) {
        this.color = new Color(r, g, b, a);
        this._isDirty = true;
        return this;
    }

    updateVisibility(neighbors) {
        this.visible = !neighbors.every(n => n);
    }

    updateVisibleFaces(neighbors) {
        let hasVisibleFace = false;
        
        this.visibleFaces.front = !neighbors.front?.isSolid();
        this.visibleFaces.back = !neighbors.back?.isSolid();
        this.visibleFaces.top = !neighbors.top?.isSolid();
        this.visibleFaces.bottom = !neighbors.bottom?.isSolid();
        this.visibleFaces.right = !neighbors.right?.isSolid();
        this.visibleFaces.left = !neighbors.left?.isSolid();
        
        // Check if at least one face is visible
        for (const face in this.visibleFaces) {
            if (this.visibleFaces[face]) {
                hasVisibleFace = true;
                break;
            }
        }
        
        this.visible = hasVisibleFace;
        this._isDirty = true;
    }

    generateRenderData() {
        if (!this._isDirty) return { vertices: this.vertices, indices: this.indices };

        const vertices = [];
        const indices = [];
        let indexOffset = 0;

        // Generate vertices and indices for each visible face
        for (const [face, isVisible] of Object.entries(this.visibleFaces)) {
            if (!isVisible) continue;

            const faceVerts = Voxel.VERTICES[face];
            const faceIndices = Voxel.INDICES[face];

            // Add vertices for this face, translated to voxel position
            for (let i = 0; i < faceVerts.length; i += 3) {
                vertices.push(
                    faceVerts[i] + this.x,
                    faceVerts[i + 1] + this.y,
                    faceVerts[i + 2] + this.z
                );
            }

            // Add indices for this face
            for (const index of faceIndices) {
                indices.push(index + indexOffset);
            }

            indexOffset += 4; // Each face has 4 vertices
        }

        this.vertices = vertices;
        this.indices = indices;
        this._isDirty = false;

        return { vertices, indices };
    }

    getPositionHash() {
        return `${this.x},${this.y},${this.z}`;
    }

    isSolid() {
        if (this.properties) {
            return this.properties.solid !== false;
        }
        return this.type !== 0;
    }

    isTransparent() {
        return this.properties ? this.properties.transparent : false;
    }

    clone() {
        return new Voxel(this.x, this.y, this.z, this.type);
    }

    getColor() {
        return this.color.toArray();
    }

    getVariantColor(variant = 0) {
        if (this.properties && this.properties.variants && this.properties.variants[variant]) {
            const [r, g, b, a] = this.properties.variants[variant];
            return [r/255, g/255, b/255, (a || 255)/255];
        }
        return this.getColor();
    }

    getVertices() {
        return [
            // Front face
            this.x, this.y, this.z + 1,
            this.x + 1, this.y, this.z + 1,
            this.x + 1, this.y + 1, this.z + 1,
            this.x, this.y + 1, this.z + 1,
            // Back face
            this.x, this.y, this.z,
            this.x, this.y + 1, this.z,
            this.x + 1, this.y + 1, this.z,
            this.x + 1, this.y, this.z,
        ];
    }

    getFaces() {
        return {
            front: [0, 1, 2, 0, 2, 3],
            back: [4, 5, 6, 4, 6, 7],
            top: [5, 3, 2, 5, 2, 6],
            bottom: [4, 7, 1, 4, 1, 0],
            right: [7, 6, 2, 7, 2, 1],
            left: [4, 0, 3, 4, 3, 5]
        };
    }
}