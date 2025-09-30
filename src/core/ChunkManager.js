import { Chunk } from '../datatypes/Chunk.js';
import { Voxel } from '../datatypes/Voxel.js';

export class ChunkManager {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.worker = new Worker('/src/workers/ChunkGenerator.js', { type: 'module' });
        this.chunkLoadDistance = 4;
        this.lastChunkUpdate = 0;
        this.chunkUpdateInterval = 250; // ms

        this.worker.onmessage = (e) => {
            const { x, y, z, voxels } = e.data;
            const chunk = new Chunk(x, y, z, this.world.chunkSize);
            for (const voxel of voxels) {
                chunk.storeVoxel(voxel.x, voxel.y, voxel.z, new Voxel(x * this.world.chunkSize + voxel.x, y * this.world.chunkSize + voxel.y, z * this.world.chunkSize + voxel.z, voxel.type));
            }
            this.world.setChunk(x, y, z, chunk);
        };
    }

    update(cameraPosition) {
        const timestamp = performance.now();
        if (timestamp - this.lastChunkUpdate < this.chunkUpdateInterval) {
            return;
        }
        this.lastChunkUpdate = timestamp;

        const cameraChunkX = Math.floor(cameraPosition.x / this.world.chunkSize);
        const cameraChunkY = Math.floor(cameraPosition.y / this.world.chunkSize);
        const cameraChunkZ = Math.floor(cameraPosition.z / this.world.chunkSize);

        const requiredChunks = new Set();
        for (let x = cameraChunkX - this.chunkLoadDistance; x <= cameraChunkX + this.chunkLoadDistance; x++) {
            for (let y = cameraChunkY - this.chunkLoadDistance; y <= cameraChunkY + this.chunkLoadDistance; y++) {
                for (let z = cameraChunkZ - this.chunkLoadDistance; z <= cameraChunkZ + this.chunkLoadDistance; z++) {
                    requiredChunks.add(`${x},${y},${z}`);
                }
            }
        }

        // Unload chunks
        for (const chunkKey of this.world.chunkPool.keys()) {
            if (!requiredChunks.has(chunkKey)) {
                this.world.chunkPool.delete(chunkKey);
                this.world.isDirty = true;
            }
        }

        // Load new chunks
        for (const key of requiredChunks) {
            if (!this.world.chunkPool.has(key)) {
                const [x, y, z] = key.split(',').map(Number);
                this.worker.postMessage({
                    x, y, z,
                    chunkSize: this.world.chunkSize,
                    noiseSeed: this.world.noise.seed,
                    generateFuncStr: this.world.generate.toString()
                });
            }
        }

        this.world.updateVisibility();
    }

    setLoadDistance(distance) {
        this.chunkLoadDistance = distance;
    }
}