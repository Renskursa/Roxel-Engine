import { VoxelMesh } from '../mesh/VoxelMesh.js';

export class WorldManager {
    constructor(renderer = null) {
        this.chunks = new Map();
        this.objects = new Map();
        this.chunkSize = 16;
        this.renderer = renderer;
    }

    getChunk(chunkX, chunkY, chunkZ) {
        const key = `${chunkX},${chunkY},${chunkZ}`;
        return this.chunks.get(key);
    }

    addChunk(chunk) {
        const key = `${chunk.x},${chunk.y},${chunk.z}`;
        this.chunks.set(key, chunk);
    }

    getVoxel(worldX, worldY, worldZ) {
        const chunkCoords = this.worldToChunkCoords(worldX, worldY, worldZ);
        const chunk = this.getChunk(chunkCoords.x, chunkCoords.y, chunkCoords.z);
        if (!chunk) return null;

        const localCoords = this.worldToLocalCoords(worldX, worldY, worldZ);
        return chunk.getVoxel(localCoords.x, localCoords.y, localCoords.z);
    }

    worldToChunkCoords(worldX, worldY, worldZ) {
        return {
            x: Math.floor(worldX / this.chunkSize),
            y: Math.floor(worldY / this.chunkSize),
            z: Math.floor(worldZ / this.chunkSize)
        };
    }

    worldToLocalCoords(worldX, worldY, worldZ) {
        return {
            x: ((worldX % this.chunkSize) + this.chunkSize) % this.chunkSize,
            y: ((worldY % this.chunkSize) + this.chunkSize) % this.chunkSize,
            z: ((worldZ % this.chunkSize) + this.chunkSize) % this.chunkSize
        };
    }

    updateChunkVisibility() {
        this.chunks.forEach(chunk => {
            const neighbors = {
                front: this.getChunk(chunk.x, chunk.y, chunk.z - 1),
                back: this.getChunk(chunk.x, chunk.y, chunk.z + 1),
                top: this.getChunk(chunk.x, chunk.y + 1, chunk.z),
                bottom: this.getChunk(chunk.x, chunk.y - 1, chunk.z),
                right: this.getChunk(chunk.x + 1, chunk.y, chunk.z),
                left: this.getChunk(chunk.x - 1, chunk.y, chunk.z)
            };

            chunk.updateVoxelVisibility(neighbors);
        });
    }

    localToWorldCoords(x, y, z) {
        return {
            worldX: x,
            worldY: y,
            worldZ: z
        };
    }

    getObjectAt(worldX, worldY, worldZ) {
        const key = `${worldX},${worldY},${worldZ}`;
        return this.objects.get(key);
    }

    setObjectAt(worldX, worldY, worldZ, object) {
        const key = `${worldX},${worldY},${worldZ}`;
        this.objects.set(key, object);
        return true;
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }

    getCombinedMesh(chunks = null) {
        if (!this.renderer) {
            throw new Error('Renderer not set in WorldManager');
        }
        
        const combinedMesh = new VoxelMesh(this.renderer);
        
        const chunksToProcess = chunks || this.chunks;
        chunksToProcess.forEach(chunk => {
            chunk.voxels.forEach(voxel => {
                if (voxel.visible) {
                    combinedMesh.addVoxel(voxel);
                }
            });
        });
        
        return combinedMesh.build();
    }
}
