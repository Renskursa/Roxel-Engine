import { Voxel } from './Voxel.js';
import { Color } from '../utils/ColorUtils.js';

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
        return x + (y * this.size) + (z * this.size * this.size);
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

    updateVoxelVisibilityState(neighborChunks = {}) {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const index = this.computeVoxelIndex(x, y, z);
                    if (this.voxelTypes[index] === 0) continue;

                    const neighbors = this.getNeighboringVoxels(x, y, z, neighborChunks);
                    const visibilityFlags = this.computeVisibilityFlags(neighbors);
                    this.voxelVisibility[index] = visibilityFlags;
                    this.voxelData[index] = (this.voxelData[index] & ~0xFF) | visibilityFlags;
                }
            }
        }
        this.isDirty = true;
    }

    getNeighboringVoxels(x, y, z, neighborChunks) {
        // Helper method to get neighboring voxels
        return {
            front: z > 0 ? this.getVoxelAt(x, y, z - 1) : 
                   (neighborChunks.front?.getVoxelAt(x, y, this.size - 1)),
            back: z < this.size - 1 ? this.getVoxelAt(x, y, z + 1) : 
                  (neighborChunks.back?.getVoxelAt(x, y, 0)),
            top: y < this.size - 1 ? this.getVoxelAt(x, y + 1, z) : 
                 (neighborChunks.top?.getVoxelAt(x, 0, z)),
            bottom: y > 0 ? this.getVoxelAt(x, y - 1, z) : 
                    (neighborChunks.bottom?.getVoxelAt(x, this.size - 1, z)),
            right: x < this.size - 1 ? this.getVoxelAt(x + 1, y, z) : 
                   (neighborChunks.right?.getVoxelAt(0, y, z)),
            left: x > 0 ? this.getVoxelAt(x - 1, y, z) : 
                  (neighborChunks.left?.getVoxelAt(this.size - 1, y, z))
        };
    }

    computeVisibilityFlags(neighbors) {
        let flags = 0;
        flags |= (!neighbors.front?.isSolid() ? 1 : 0) << 0;
        flags |= (!neighbors.back?.isSolid() ? 1 : 0) << 1;
        flags |= (!neighbors.top?.isSolid() ? 1 : 0) << 2;
        flags |= (!neighbors.bottom?.isSolid() ? 1 : 0) << 3;
        flags |= (!neighbors.right?.isSolid() ? 1 : 0) << 4;
        flags |= (!neighbors.left?.isSolid() ? 1 : 0) << 5;
        return flags;
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

    iterateVoxels(callback) {
        for(let x = 0; x < this.size; x++) {
            for(let y = 0; y < this.size; y++) {
                for(let z = 0; z < this.size; z++) {
                    const voxel = this.getVoxelAt(x, y, z);
                    if (voxel) callback(voxel, x, y, z);
                }
            }
        }
    }

    generateRenderData() {
        if (!this.isDirty && this._renderDataCache) {
            return this._renderDataCache;
        }

        const instances = [];
        this.iterateVoxels((voxel) => {
            if (voxel.visible && voxel.type > 0) {
                instances.push({
                    position: [voxel.x, voxel.y, voxel.z],
                    color: voxel.getColor(),
                    ao: 1.0, // Placeholder for ambient occlusion
                });
            }
        });

        this._renderDataCache = { instances };
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
