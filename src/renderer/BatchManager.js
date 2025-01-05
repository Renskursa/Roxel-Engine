export class BatchManager {
    constructor(gl) {
        this.gl = gl;
        this.batches = new Map(); // key: materialId, value: batch data
        this.maxBatchSize = 65536; // Maximum vertices per batch
    }

    addToBatch(renderData, materialId = 'default') {
        let batch = this.batches.get(materialId);
        
        if (!batch) {
            batch = {
                vertices: [],
                indices: [],
                colors: [],
                vertexCount: 0,
                indexOffset: 0
            };
            this.batches.set(materialId, batch);
        }

        // Check if we need to start a new batch
        if (batch.vertexCount + renderData.vertices.length / 3 > this.maxBatchSize) {
            this.flush(materialId);
            batch = {
                vertices: [],
                indices: [],
                colors: [],
                vertexCount: 0,
                indexOffset: 0
            };
            this.batches.set(materialId, batch);
        }

        // Add vertices
        batch.vertices.push(...renderData.vertices);

        // Add indices with offset
        if (renderData.indices) {
            const offsetIndices = renderData.indices.map(i => i + batch.vertexCount);
            batch.indices.push(...offsetIndices);
        }

        // Add colors
        if (renderData.colors) {
            batch.colors.push(...renderData.colors);
        }

        batch.vertexCount += renderData.vertices.length / 3;
        batch.indexOffset = batch.vertices.length / 3;
    }

    flush(materialId = null) {
        if (materialId) {
            // Flush specific batch
            const batch = this.batches.get(materialId);
            if (batch && batch.vertices.length > 0) {
                this.processBatch(batch);
                this.batches.delete(materialId);
            }
        } else {
            // Flush all batches
            for (const [id, batch] of this.batches) {
                if (batch.vertices.length > 0) {
                    this.processBatch(batch);
                }
            }
            this.batches.clear();
        }
    }

    processBatch(batch) {
        // Make sure colors array is flattened and converted to Float32Array
        const flatColors = batch.colors.flat();
        return {
            vertices: new Float32Array(batch.vertices),
            indices: batch.indices.length > 0 ? new Uint16Array(batch.indices) : null,
            colors: new Float32Array(flatColors)
        };
    }

    clear() {
        this.batches.clear();
    }
}
