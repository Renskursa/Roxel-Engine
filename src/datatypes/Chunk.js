import { Voxel } from './Voxel.js';
import { Color } from '../utils/ColorUtils.js';
import { VoxelGeometry } from '../renderer/VoxelGeometry.js';

/**
 * Represents a chunk of voxels in 3D space
 */
export class Chunk {
    /**
     * @param {number} x - X position of the chunk in chunk space
     * @param {number} y - Y position of the chunk in chunk space
     * @param {number} z - Z position of the chunk in chunk space
     * @param {number} size - Size of the chunk (default: 16)
     */
    constructor(x = 0, y = 0, z = 0, size = 16) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        
        // Calculate total voxel count
        const totalVoxels = size * size * size;
        
        // Create typed arrays for voxel data
        this.voxelTypes = new Uint8Array(totalVoxels);  // Store voxel type IDs
        this.voxelData = new Uint32Array(totalVoxels);  // Store additional voxel data (flags, etc.)
        this.voxelColors = new Float32Array(totalVoxels * 4);  // RGBA colors
        this.voxelVisibility = new Uint8Array(totalVoxels);  // Visibility flags
        
        this.isDirty = true;
        this.creationTime = performance.now();
        this.hasInitializedAnimation = false;
        this.visible = true;
        this.isDirty = true;
        this._renderDataCache = null;
    }

    computeVoxelIndex(x, y, z) {
        // Corrected to z,y,x order to match worker and improve cache efficiency
        return z * this.size * this.size + y * this.size + x;
    }

    buildFromWorkerData({ voxelTypes, voxelColors }) {
        this.voxelTypes = new Uint8Array(voxelTypes);
        this.voxelColors = new Float32Array(voxelColors);
        this.isDirty = true;
    }

    storeVoxel(x, y, z, voxel) {
        if (!this.isPositionInBounds(x, y, z)) return false;

        const index = this.computeVoxelIndex(x, y, z);
        this.voxelTypes[index] = voxel.type;
        
        // Store simple color data
        const colorIndex = index * 4;
        const color = voxel.getColor();
        const colorArray = color instanceof Color ? color.toArray() : color;

        this.voxelColors[colorIndex] = colorArray[0];
        this.voxelColors[colorIndex + 1] = colorArray[1];
        this.voxelColors[colorIndex + 2] = colorArray[2];
        this.voxelColors[colorIndex + 3] = colorArray[3];

        this.voxelData[index] = voxel.visible ? 1 : 0;
        this.isDirty = true;
        return true;
    }

    getVoxelAt(x, y, z) {
        if (!this.isPositionInBounds(x, y, z)) return null;
        
        const index = this.computeVoxelIndex(x, y, z);
        if (this.voxelTypes[index] === 0) return null;
        
        const voxel = new Voxel(
            x + this.x * this.size,
            y + this.y * this.size,
            z + this.z * this.size,
            this.voxelTypes[index]
        );

        // Set color from stored color data
        const colorIndex = index * 4;
        voxel.setColor(
            this.voxelColors[colorIndex],
            this.voxelColors[colorIndex + 1],
            this.voxelColors[colorIndex + 2],
            this.voxelColors[colorIndex + 3]
        );

        voxel.visible = (this.voxelData[index] & 1) !== 0;
        return voxel;
    }

    isPositionInBounds(x, y, z) {
        return x >= 0 && x < this.size &&
               y >= 0 && y < this.size &&
               z >= 0 && z < this.size;
    }

    getVoxelType(x, y, z) {
        if (!this.isPositionInBounds(x, y, z)) {
            return 0; // Air
        }
        return this.voxelTypes[this.computeVoxelIndex(x, y, z)];
    }

    updateVoxelVisibilityState(neighborChunks = {}) {
        let i = 0;
        for (let z = 0; z < this.size; z++) {
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (this.voxelTypes[i] === 0) {
                        this.voxelVisibility[i] = 0;
                        i++;
                        continue;
                    }

                    const neighbors = {
                        front: z > 0 ? this.getVoxelType(x, y, z - 1) : (neighborChunks.front ? neighborChunks.front.getVoxelType(x, y, this.size - 1) : 0),
                        back:  z < this.size - 1 ? this.getVoxelType(x, y, z + 1) : (neighborChunks.back ? neighborChunks.back.getVoxelType(x, y, 0) : 0),
                        top:   y < this.size - 1 ? this.getVoxelType(x, y + 1, z) : (neighborChunks.top ? neighborChunks.top.getVoxelType(x, 0, z) : 0),
                        bottom:y > 0 ? this.getVoxelType(x, y - 1, z) : (neighborChunks.bottom ? neighborChunks.bottom.getVoxelType(x, this.size - 1, z) : 0),
                        right: x < this.size - 1 ? this.getVoxelType(x + 1, y, z) : (neighborChunks.right ? neighborChunks.right.getVoxelType(0, y, z) : 0),
                        left:  x > 0 ? this.getVoxelType(x - 1, y, z) : (neighborChunks.left ? neighborChunks.left.getVoxelType(this.size - 1, y, z) : 0),
                    };

                    let flags = 0;
                    if (!neighbors.front) flags |= 1 << 0;
                    if (!neighbors.back) flags |= 1 << 1;
                    if (!neighbors.top) flags |= 1 << 2;
                    if (!neighbors.bottom) flags |= 1 << 3;
                    if (!neighbors.right) flags |= 1 << 4;
                    if (!neighbors.left) flags |= 1 << 5;

                    this.voxelVisibility[i] = flags;
                    this.voxelData[i] = (this.voxelData[i] & ~0xFF) | flags;
                    i++;
                }
            }
        }
        this.isDirty = true;
    }

    // Add serialization methods for chunk data
    serialize() {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            size: this.size,
            voxelTypes: Array.from(this.voxelTypes),
            voxelData: Array.from(this.voxelData),
            voxelColors: Array.from(this.voxelColors),
            voxelVisibility: Array.from(this.voxelVisibility)
        };
    }

    static deserialize(data) {
        const chunk = new Chunk(data.x, data.y, data.z, data.size);
        chunk.voxelTypes.set(data.voxelTypes);
        chunk.voxelData.set(data.voxelData);
        chunk.voxelColors.set(data.voxelColors);
        chunk.voxelVisibility.set(data.voxelVisibility);
        return chunk;
    }

    createColoredVoxel(x, y, z, r, g, b, a = 1.0) {
        const voxel = new Voxel(x, y, z, 1);
        voxel.setColor(r, g, b, a);
        this.storeVoxel(x, y, z, voxel);
        return voxel;
    }

    generateRenderData() {
        if (!this.isDirty && this._renderDataCache) {
            return this._renderDataCache;
        }

        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const colors = [];
        let vertexIndex = 0;
        let i = 0;

        for (let z = 0; z < this.size; z++) {
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (this.voxelTypes[i] === 0) {
                        i++;
                        continue;
                    }

                    const visibilityFlags = this.voxelVisibility[i];
                    if (visibilityFlags === 0) {
                        i++;
                        continue;
                    }

                    const worldX = this.x * this.size + x;
                    const worldY = this.y * this.size + y;
                    const worldZ = this.z * this.size + z;

                    const colorIndex = i * 4;
                    const r = this.voxelColors[colorIndex];
                    const g = this.voxelColors[colorIndex + 1];
                    const b = this.voxelColors[colorIndex + 2];
                    const a = this.voxelColors[colorIndex + 3];

                    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                        if ((visibilityFlags & (1 << faceIndex)) !== 0) {
                            const face = VoxelGeometry.faces[faceIndex];

                            for (const vert of face.vertices) {
                                vertices.push(vert.pos[0] + worldX, vert.pos[1] + worldY, vert.pos[2] + worldZ);
                                normals.push(...face.normal);
                                uvs.push(...vert.uv);
                                colors.push(r, g, b, a);
                            }

                            for (const idx of face.indices) {
                                indices.push(vertexIndex + idx);
                            }
                            vertexIndex += face.vertices.length;
                        }
                    }
                    i++;
                }
            }
        }

        if (vertices.length === 0) {
            this._renderDataCache = null;
            this.isDirty = false;
            return null;
        }

        this._renderDataCache = {
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices: new Uint32Array(indices),
            colors: new Float32Array(colors)
        };
        this.isDirty = false;
        return this._renderDataCache;
    }

    isFull() {
        for (let i = 0; i < this.voxelTypes.length; i++) {
            if (this.voxelTypes[i] === 0) {
                return false;
            }
        }
        return true;
    }
}
