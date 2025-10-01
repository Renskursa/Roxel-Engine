import { Chunk } from '../datatypes/Chunk.js';
import { Voxel } from '../datatypes/Voxel.js';

export class World {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 16;
        this.chunkPool = new Map();
        this.generate = options.generate || function(x, y, z, noise) {
            // Create a simple flat world at y=0 with a few blocks
            if (y === 0 && Math.abs(x) < 10 && Math.abs(z) < 10) {
                return 1;
            }
            return 0;
        };
        this.noise = options.noise;
        this.isDirty = true;
    }

    getChunk(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.chunkPool.get(key);
    }

    setChunk(x, y, z, chunk) {
        const key = `${x},${y},${z}`;
        this.chunkPool.set(key, chunk);
        this.isDirty = true;
        // Update visibility only for this chunk and its neighbors
        this.updateVisibilityFor(x, y, z);
    }

    getVoxel(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);

        const localX = x % this.chunkSize;
        const localY = y % this.chunkSize;
        const localZ = z % this.chunkSize;

        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (chunk) {
            const voxel = chunk.getVoxelAt(localX, localY, localZ);
            return voxel ? voxel.type : 0;
        }
        return 0;
    }

    setVoxel(x, y, z, value) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);

        const localX = x % this.chunkSize;
        const localY = y % this.chunkSize;
        const localZ = z % this.chunkSize;

        let chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (chunk) {
            const voxel = new Voxel(x, y, z, value);
            chunk.storeVoxel(localX, localY, localZ, voxel);
            chunk.isDirty = true;
            this.isDirty = true;
        }
    }

    updateVisibility() {
        let visibilityChanged = false;
        for (const chunk of this.chunkPool.values()) {
            if (!chunk) continue;
            const neighbors = {
                front:  this.getChunk(chunk.x, chunk.y, chunk.z + 1),
                back:   this.getChunk(chunk.x, chunk.y, chunk.z - 1),
                top:    this.getChunk(chunk.x, chunk.y + 1, chunk.z),
                bottom: this.getChunk(chunk.x, chunk.y - 1, chunk.z),
                right:  this.getChunk(chunk.x + 1, chunk.y, chunk.z),
                left:   this.getChunk(chunk.x - 1, chunk.y, chunk.z)
            };

            // Update per-voxel face visibility using neighbor information
            chunk.updateVoxelVisibilityState(neighbors);

            const isOccluded =
                !!(neighbors.front  && neighbors.front.isFull()) &&
                !!(neighbors.back   && neighbors.back.isFull()) &&
                !!(neighbors.top    && neighbors.top.isFull()) &&
                !!(neighbors.bottom && neighbors.bottom.isFull()) &&
                !!(neighbors.right  && neighbors.right.isFull()) &&
                !!(neighbors.left   && neighbors.left.isFull());

            if (chunk.visible !== !isOccluded) {
                chunk.visible = !isOccluded;
                visibilityChanged = true;
            }
        }
        if (visibilityChanged) {
            this.isDirty = true;
        }
    }

    // Optimized: update visibility for a specific chunk and its neighbors only
    updateVisibilityFor(x, y, z) {
        const positions = [
            [x, y, z],
            [x, y, z + 1],
            [x, y, z - 1],
            [x, y + 1, z],
            [x, y - 1, z],
            [x + 1, y, z],
            [x - 1, y, z]
        ];
        let changed = false;
        for (const [cx, cy, cz] of positions) {
            const chunk = this.getChunk(cx, cy, cz);
            if (!chunk) continue;
            const neighbors = {
                front:  this.getChunk(cx, cy, cz + 1),
                back:   this.getChunk(cx, cy, cz - 1),
                top:    this.getChunk(cx, cy + 1, cz),
                bottom: this.getChunk(cx, cy - 1, cz),
                right:  this.getChunk(cx + 1, cy, cz),
                left:   this.getChunk(cx - 1, cy, cz)
            };
            chunk.updateVoxelVisibilityState(neighbors);
            chunk.isDirty = true;
            changed = true;
        }
        if (changed) this.isDirty = true;
    }
}