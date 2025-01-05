export class VoxelBufferPool {
    constructor() {
        // Adjust buffer sizes to be more conservative
        this.bufferSizes = [
            256,    // 0.25K
            1024,   // 1K
            4096,   // 4K
            16384,  // 16K
            65536   // 64K - Maximum size
        ];

        // Keep track of specific pool stats
        this.stats = {
            hits: 0,
            misses: 0,
            allocations: 0,
            totalMemory: 0
        };

        // Create pools for each size
        this.pools = new Map();
        this.bufferSizes.forEach(size => {
            this.pools.set(size, []);
        });

        // Configuration
        this.maxBuffersPerPool = 10;
        this.maxTotalBuffers = 100;
        this.totalBuffers = 0;
        this.maxMemoryMB = 64; // 64MB limit
        
        // Pre-warm the pools
        this.preallocateBuffers();
    }

    preallocateBuffers() {
        // Only preallocate small buffers
        const smallSizes = this.bufferSizes.slice(0, 2);
        for (const size of smallSizes) {
            const pool = this.pools.get(size);
            // Create 2 buffers of each small size
            for (let i = 0; i < 2; i++) {
                const buffer = new Float32Array(size);
                pool.push({
                    buffer,
                    inUse: false,
                    lastUsed: Date.now(),
                    size: size * 4 // size in bytes
                });
                this.stats.totalMemory += size * 4;
                this.totalBuffers++;
            }
        }
    }

    findBestFit(requiredSize) {
        // Add maximum size limit
        const MAX_BUFFER_SIZE = 65536;
        const limitedSize = Math.min(requiredSize, MAX_BUFFER_SIZE);
        return this.bufferSizes.find(size => size >= limitedSize) || limitedSize;
    }

    acquireBuffers(chunkSize) {
        // Calculate conservative buffer sizes based on chunk dimensions
        const vertexSize = Math.min(chunkSize * chunkSize * 6, 4096);
        const colorSize = Math.min(chunkSize * chunkSize * 8, 4096);

        return {
            vertices: this.getBuffer(vertexSize),
            colors: this.getBuffer(colorSize)
        };
    }

    getBuffer(requiredSize) {
        const optimalSize = this.findBestFit(requiredSize) || requiredSize;
        const pool = this.pools.get(optimalSize);

        // Try to find an available buffer
        if (pool) {
            const available = pool.find(b => !b.inUse);
            if (available) {
                available.inUse = true;
                available.lastUsed = Date.now();
                this.stats.hits++;
                return available.buffer;
            }
        }

        // Check if we can create a new buffer
        if (this.canAllocateMore(optimalSize)) {
            return this.allocateNewBuffer(optimalSize);
        }

        // Try cleanup and retry
        this.cleanup();
        
        // Try to find a buffer again after cleanup
        const reclaimedBuffer = this.findReclaimableBuffer(optimalSize);
        if (reclaimedBuffer) {
            reclaimedBuffer.inUse = true;
            reclaimedBuffer.lastUsed = Date.now();
            this.stats.hits++;
            return reclaimedBuffer.buffer;
        }

        // Last resort: create minimum size buffer
        const minSize = Math.min(requiredSize, this.bufferSizes[0]);
        this.stats.misses++;
        return new Float32Array(minSize);
    }

    canAllocateMore(size) {
        const memoryRequired = size * 4; // Float32 = 4 bytes
        return (
            this.totalBuffers < this.maxTotalBuffers &&
            this.stats.totalMemory + memoryRequired < this.maxMemoryMB * 1024 * 1024
        );
    }

    allocateNewBuffer(size) {
        try {
            const buffer = new Float32Array(size);
            const pool = this.pools.get(size) || [];
            
            pool.push({
                buffer,
                inUse: true,
                lastUsed: Date.now(),
                size: size * 4
            });
            
            this.pools.set(size, pool);
            this.stats.totalMemory += size * 4;
            this.totalBuffers++;
            this.stats.allocations++;
            
            return buffer;
        } catch (e) {
            this.cleanup();
            return null;
        }
    }

    releaseBuffer(buffer) {
        for (const pool of this.pools.values()) {
            const found = pool.find(b => b.buffer === buffer);
            if (found) {
                found.inUse = false;
                found.lastUsed = Date.now();
                return;
            }
        }
    }

    cleanup() {
        const now = Date.now();
        let freedMemory = 0;
        
        for (const [size, pool] of this.pools) {
            // Remove old unused buffers
            const oldBuffers = pool.filter(b => 
                !b.inUse && (now - b.lastUsed) > 5000
            );
            
            // Update stats
            freedMemory += oldBuffers.reduce((sum, b) => sum + b.size, 0);
            this.totalBuffers -= oldBuffers.length;
            
            // Keep only in-use and recent buffers
            this.pools.set(size, pool.filter(b => 
                b.inUse || (now - b.lastUsed) <= 5000
            ));
        }
        
        this.stats.totalMemory -= freedMemory;
    }

    findReclaimableBuffer(targetSize) {
        for (const [size, pool] of this.pools) {
            if (size >= targetSize) {
                return pool.find(b => !b.inUse);
            }
        }
        return null;
    }
}
