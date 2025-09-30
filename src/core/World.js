import { Chunk } from '../datatypes/Chunk.js';
import { Voxel } from '../datatypes/Voxel.js';

export class World {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 16;
        this.chunkPool = new Map();
        this.generate = options.generate || function(x, y, z, noise) {
            if (y < 0) {
                return 1;
            }
            return 0;
        };
        this.noise = options.noise;
    }

    getChunk(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.chunkPool.get(key);
    }

    setChunk(x, y, z, chunk) {
        const key = `${x},${y},${z}`;
        this.chunkPool.set(key, chunk);
    }

    createChunk(x, y, z) {
        const chunk = new Chunk(x, y, z, this.chunkSize);
        if (this.generate) {
            for (let localX = 0; localX < this.chunkSize; localX++) {
                for (let localY = 0; localY < this.chunkSize; localY++) {
                    for (let localZ = 0; localZ < this.chunkSize; localZ++) {
                        const worldX = x * this.chunkSize + localX;
                        const worldY = y * this.chunkSize + localY;
                        const worldZ = z * this.chunkSize + localZ;
                        const voxelType = this.generate(worldX, worldY, worldZ, this.noise);
                        if (voxelType > 0) {
                            const voxel = new Voxel(worldX, worldY, worldZ, voxelType);
                            chunk.storeVoxel(localX, localY, localZ, voxel);
                        }
                    }
                }
            }
        }
        this.setChunk(x, y, z, chunk);
        return chunk;
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
        if (!chunk) {
            chunk = this.createChunk(chunkX, chunkY, chunkZ);
        }

        const voxel = new Voxel(x, y, z, value);
        chunk.storeVoxel(localX, localY, localZ, voxel);
    }
}