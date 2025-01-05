export class ChunkPool {
    constructor() {
        this.bufferSizes = [
            512,     // 0.5K
            1024,    // 1K
            2048,    // 2K
            4096,    // 4K
            8192,    // 8K
            16384    // 16K max
        ];
        
        this.pools = new Map(); // Map of size -> array of buffers
        this.maxPoolSize = 5;   // Maximum number of buffers per size
        this.totalMemory = 0;
        this.maxTotalMemory = 1024 * 1024 * 512; // 512MB limit

        // Pre-allocate some common buffer sizes
        this.initializePools();
    }

    initializePools() {
        // Pre-allocate smallest sizes
        for (let i = 0; i < 2 && i < this.bufferSizes.length; i++) {
            const size = this.bufferSizes[i];
            const pool = [];
            for (let j = 0; j < 2; j++) {
                pool.push({
                    buffer: new Float32Array(size),
                    inUse: false
                });
                this.totalMemory += size * 4;
            }
            this.pools.set(size, pool);
        }
    }

    findBestSize(requiredSize) {
        // Find the smallest buffer size that fits
        return this.bufferSizes.find(size => size >= requiredSize) || requiredSize;
    }

    getBuffer(requiredSize) {
        // Log large buffer requests
        if (requiredSize > 16384) {
            console.warn(`Large buffer request: ${requiredSize} bytes. Capping at 16384.`);
            requiredSize = 16384;
        }

        const optimalSize = this.findBestSize(Math.min(requiredSize, 16384));
        let pool = this.pools.get(optimalSize);

        // Try to find an available buffer in the pool
        if (pool) {
            const buffer = pool.find(b => !b.inUse);
            if (buffer) {
                buffer.inUse = true;
                return buffer.buffer;
            }
        }

        // Create a new pool if it doesn't exist
        if (!pool) {
            pool = [];
            this.pools.set(optimalSize, pool);
        }

        // Create a new buffer if pool isn't full
        if (pool.length < this.maxPoolSize && this.totalMemory + optimalSize * 4 < this.maxTotalMemory) {
            const newBuffer = {
                buffer: new Float32Array(optimalSize),
                inUse: true
            };
            pool.push(newBuffer);
            this.totalMemory += optimalSize * 4;
            return newBuffer.buffer;
        }

        // If we can't create new buffer, try cleanup and retry
        this.cleanup();
        
        // Try one more time after cleanup
        const availableBuffer = pool.find(b => !b.inUse);
        if (availableBuffer) {
            availableBuffer.inUse = true;
            return availableBuffer.buffer;
        }

        // Last resort: create temporary buffer
        console.warn(`Creating temporary buffer of size ${requiredSize}`);
        return new Float32Array(requiredSize);
    }

    releaseBuffer(buffer) {
        for (const [size, pool] of this.pools) {
            const found = pool.find(b => b.buffer === buffer);
            if (found) {
                found.inUse = false;
                return;
            }
        }
    }

    cleanup() {
        // Remove least used pool sizes
        const usage = new Map();
        
        for (const [size, pool] of this.pools) {
            usage.set(size, pool.filter(b => b.inUse).length);
        }

        // Sort by usage and remove unused pools
        const sortedUsage = Array.from(usage.entries())
            .sort((a, b) => a[1] - b[1]);

        for (const [size, used] of sortedUsage) {
            if (used === 0 && !this.bufferSizes.includes(size)) {
                const pool = this.pools.get(size);
                this.totalMemory -= size * 4 * pool.length;
                this.pools.delete(size);
            }
        }
    }
}
