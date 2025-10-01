import { Chunk } from '../datatypes/Chunk.js';

export class ChunkManager {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.worker = new Worker('/src/workers/ChunkGenerator.js', { type: 'module' });
        this.chunkLoadDistance = 4; // Default load distance
        this.lastChunkUpdate = 0;
        this.chunkUpdateInterval = 100; // Update every 100ms
        this.pendingChunks = [];
        this.maxChunkIntegrationsPerTick = 4;
        this.maxRequestsPerTick = 8;
        this._requestedChunkKeys = new Set();

        this.worker.onmessage = (e) => {
            // Directly queue the payload for batched integration
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

        // Unload chunks that are out of range
        for (const chunkKey of this.world.chunkPool.keys()) {
            if (!requiredChunks.has(chunkKey)) {
                const [ux, uy, uz] = chunkKey.split(',').map(Number);
                this.world.chunkPool.delete(chunkKey);
                // Notify neighbors of removal for visibility updates
                this.world.updateVisibilityFor(ux, uy, uz);
            }
        }

        const missing = [];
        for (const key of requiredChunks) {
            if (!this.world.chunkPool.has(key) && !this._requestedChunkKeys.has(key)) {
                const [x, y, z] = key.split(',').map(Number);
                const dx = (x + 0.5) * this.world.chunkSize - cameraPosition.x;
                const dy = (y + 0.5) * this.world.chunkSize - cameraPosition.y;
                const dz = (z + 0.5) * this.world.chunkSize - cameraPosition.z;
                missing.push({ key, x, y, z, dist2: dx * dx + dy * dy + dz * dz });
            }
        }

        missing.sort((a, b) => a.dist2 - b.dist2);

        const toRequest = missing.slice(0, this.maxRequestsPerTick);
        for (const { key, x, y, z } of toRequest) {
            this._requestedChunkKeys.add(key);
            this.worker.postMessage({
                x, y, z,
                chunkSize: this.world.chunkSize,
                noiseSeed: this.world.noise.seed,
                generateFuncStr: this.world.generate.toString()
            });
        }

        // Integrate a limited number of generated chunks per tick
        let integrated = 0;
        while (this.pendingChunks.length > 0 && integrated < this.maxChunkIntegrationsPerTick) {
            const workerData = this.pendingChunks.shift();
            const { x, y, z } = workerData;

            const chunk = new Chunk(x, y, z, this.world.chunkSize);
            chunk.buildFromWorkerData(workerData); // Use the new, fast method

            this.world.setChunk(x, y, z, chunk);
            this._requestedChunkKeys.delete(`${x},${y},${z}`);
            integrated++;
        }
    }

    setLoadDistance(distance) {
        this.chunkLoadDistance = distance;
    }
}