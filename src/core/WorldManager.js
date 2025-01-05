export class WorldManager {
    constructor() {
        this.objectPositions = new Map();
        this.chunkSize = 16;
    }

    // Core position conversion methods
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

    localToWorldCoords(chunkX, chunkY, chunkZ, localX, localY, localZ) {
        return {
            x: chunkX * this.chunkSize + localX,
            y: chunkY * this.chunkSize + localY,
            z: chunkZ * this.chunkSize + localZ
        };
    }

    // Object position tracking
    trackObject(obj) {
        this.objectPositions.set(obj.id, { ...obj.position });
    }

    untrackObject(obj) {
        this.objectPositions.delete(obj.id);
    }

    updatePosition(obj) {
        if (this.objectPositions.has(obj.id)) {
            this.objectPositions.set(obj.id, { ...obj.position });
        }
    }

    getPosition(obj) {
        return this.objectPositions.get(obj.id) || null;
    }

    // Spatial queries
    findInRadius(center, radius) {
        const found = [];
        this.objectPositions.forEach((pos, id) => {
            if (this.getDistance(center, pos) <= radius) {
                found.push(id);
            }
        });
        return found;
    }

    findInBox(min, max) {
        return Array.from(this.objectPositions.entries())
            .filter(([_, pos]) => this.isInBox(pos, min, max))
            .map(([id]) => id);
    }

    findNearest(point, maxDist = Infinity) {
        let nearest = null;
        let minDist = maxDist;

        this.objectPositions.forEach((pos, id) => {
            const dist = this.getDistance(point, pos);
            if (dist < minDist) {
                minDist = dist;
                nearest = id;
            }
        });

        return nearest;
    }

    // Helper methods
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    isInBox(pos, min, max) {
        return pos.x >= min.x && pos.x <= max.x &&
               pos.y >= min.y && pos.y <= max.y &&
               pos.z >= min.z && pos.z <= max.z;
    }
}
