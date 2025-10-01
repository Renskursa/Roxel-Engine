export class VoxelBufferPool {
    constructor(gl) {
        this.gl = gl;
        this.pool = new Map();
        this.availableBuffers = [];
    }

    getBuffer(chunk) {
        const chunkKey = `${chunk.x},${chunk.y},${chunk.z}`;
        if (this.pool.has(chunkKey)) {
            return this.pool.get(chunkKey);
        }

        if (this.availableBuffers.length > 0) {
            const buffers = this.availableBuffers.pop();
            this.pool.set(chunkKey, buffers);
            return buffers;
        }

        const buffers = this._createBuffers();
        this.pool.set(chunkKey, buffers);
        return buffers;
    }

    updateBuffer(chunk, renderData) {
        const gl = this.gl;
        const buffers = this.getBuffer(chunk);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, renderData.vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, renderData.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, renderData.colors, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, renderData.uvs, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, renderData.indices, gl.STATIC_DRAW);

        buffers.elementCount = renderData.indices.length;

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return buffers;
    }

    releaseBuffer(chunk) {
        const chunkKey = `${chunk.x},${chunk.y},${chunk.z}`;
        if (this.pool.has(chunkKey)) {
            const buffers = this.pool.get(chunkKey);
            this.availableBuffers.push(buffers);
            this.pool.delete(chunkKey);
        }
    }

    _createBuffers() {
        const gl = this.gl;
        return {
            vertexBuffer: gl.createBuffer(),
            normalBuffer: gl.createBuffer(),
            colorBuffer: gl.createBuffer(),
            uvBuffer: gl.createBuffer(),
            indexBuffer: gl.createBuffer(),
            elementCount: 0
        };
    }

    dispose() {
        const gl = this.gl;
        this.pool.forEach(buffers => {
            gl.deleteBuffer(buffers.vertexBuffer);
            gl.deleteBuffer(buffers.normalBuffer);
            gl.deleteBuffer(buffers.colorBuffer);
            gl.deleteBuffer(buffers.uvBuffer);
            gl.deleteBuffer(buffers.indexBuffer);
        });
        this.pool.clear();
        this.availableBuffers.forEach(buffers => {
            gl.deleteBuffer(buffers.vertexBuffer);
            gl.deleteBuffer(buffers.normalBuffer);
            gl.deleteBuffer(buffers.colorBuffer);
            gl.deleteBuffer(buffers.uvBuffer);
            gl.deleteBuffer(buffers.indexBuffer);
        });
        this.availableBuffers = [];
    }
}