import { Chunk } from '../datatypes/Chunk.js';
import { Voxel } from '../datatypes/Voxel.js';

export class ChunkManager {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.worker = new Worker('/src/workers/ChunkGenerator.js', { type: 'module' });
        this.chunkLoadDistance = 1; // Reduced default to limit work
        this.lastChunkUpdate = 0;
        this.chunkUpdateInterval = 50; // Faster responsiveness
        this.pendingChunks = [];
        this.maxChunkIntegrationsPerTick = 8;
        this.maxRequestsPerTick = 16;
        this._requestedChunkKeys = new Set();

        this.worker.onmessage = (e) => {
            const { x, y, z, voxels } = e.data;
            if (!voxels || voxels.length === 0) return;
            // Queue chunk payload for batched integration in update()
            this.pendingChunks.push(e.data);
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
                const [ux, uy, uz] = chunkKey.split(',').map(Number);
                this.world.chunkPool.delete(chunkKey);
                this.world.updateVisibilityFor(ux, uy, uz);
            }
        }

        // Load new chunks prioritized by distance to camera
        const missing = [];
        for (const key of requiredChunks) {
            if (!this.world.chunkPool.has(key) && !this._requestedChunkKeys.has(key)) {
                const [x, y, z] = key.split(',').map(Number);
                const centerX = (x + 0.5) * this.world.chunkSize;
                const centerY = (y + 0.5) * this.world.chunkSize;
                const centerZ = (z + 0.5) * this.world.chunkSize;
                const dx = centerX - cameraPosition.x;
                const dy = centerY - cameraPosition.y;
                const dz = centerZ - cameraPosition.z;
                const dist2 = dx * dx + dy * dy + dz * dz;
                missing.push({ key, x, y, z, dist2 });
            }
        }

        missing.sort((a, b) => a.dist2 - b.dist2);
        const toRequest = missing.slice(0, this.maxRequestsPerTick);
        for (const item of toRequest) {
            this._requestedChunkKeys.add(item.key);
            this.worker.postMessage({
                x: item.x,
                y: item.y,
                z: item.z,
                chunkSize: this.world.chunkSize,
                noiseSeed: this.world.noise.seed,
                generateFuncStr: this.world.generate.toString()
            });
        }

        // Integrate a limited number of generated chunks per tick
        let integrated = 0;
        while (this.pendingChunks.length > 0 && integrated < this.maxChunkIntegrationsPerTick) {
            const { x, y, z, voxels } = this.pendingChunks.shift();
            const chunk = new Chunk(x, y, z, this.world.chunkSize);
            for (const voxel of voxels) {
                chunk.storeVoxel(
                    voxel.x,
                    voxel.y,
                    voxel.z,
                    new Voxel(
                        x * this.world.chunkSize + voxel.x,
                        y * this.world.chunkSize + voxel.y,
                        z * this.world.chunkSize + voxel.z,
                        voxel.type
                    )
                );
            }
            this.world.setChunk(x, y, z, chunk);
            this._requestedChunkKeys.delete(`${x},${y},${z}`);
            integrated++;
        }

        // Global visibility recompute avoided; handled per set/unload.
    }

    setLoadDistance(distance) {
        this.chunkLoadDistance = distance;
    }
}