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
        this.voxels = new Map();
        this.isDirty = true;
        this.creationTime = performance.now();
        this.hasInitializedAnimation = false;
    }

    setVoxel(x, y, z, voxel) {
        const key = `${x},${y},${z}`;
        if (this.isInBounds(x, y, z)) {
            this.voxels.set(key, voxel);
            this.isDirty = true;
            return true;
        }
        return false;
    }

    getVoxel(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.voxels.get(key);
    }

    isInBounds(x, y, z) {
        return x >= 0 && x < this.size &&
               y >= 0 && y < this.size &&
               z >= 0 && z < this.size;
    }

    updateVoxelVisibility(neighborChunks = {}) {
        this.voxels.forEach((voxel, key) => {
            const [x, y, z] = key.split(',').map(Number);
            
            // Handle cross-chunk boundaries for neighbor checks
            const neighbors = {
                front: z > 0 ? this.getVoxel(x, y, z - 1) : 
                       (neighborChunks.front?.getVoxel(x, y, this.size - 1)),
                back: z < this.size - 1 ? this.getVoxel(x, y, z + 1) : 
                      (neighborChunks.back?.getVoxel(x, y, 0)),
                top: y < this.size - 1 ? this.getVoxel(x, y + 1, z) : 
                     (neighborChunks.top?.getVoxel(x, 0, z)),
                bottom: y > 0 ? this.getVoxel(x, y - 1, z) : 
                        (neighborChunks.bottom?.getVoxel(x, this.size - 1, z)),
                right: x < this.size - 1 ? this.getVoxel(x + 1, y, z) : 
                       (neighborChunks.right?.getVoxel(0, y, z)),
                left: x > 0 ? this.getVoxel(x - 1, y, z) : 
                      (neighborChunks.left?.getVoxel(this.size - 1, y, z))
            };

            voxel.updateVisibleFaces(neighbors);
        });
        this.isDirty = true;
    }
}
