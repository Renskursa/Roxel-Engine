export class RenderBatch {
    constructor(gl, maxSize) {
        this.gl = gl;
        this.maxSize = maxSize;
        this.objects = [];
        this.vertices = [];
        this.colors = [];
        this.indices = [];
        this.count = 0;
    }

    isFull() {
        return this.count >= this.maxSize;
    }

    add(object) {
        if (this.isFull()) return false;
        this.objects.push(object);
        this.count++;
        return true;
    }

    render() {
        if (this.objects.length === 0) return;
        
        const gl = this.gl;
        const firstObject = this.objects[0];
        const program = firstObject.material.program;

        gl.useProgram(program);
        
        // Render batch using the shared program and textures
        this.objects.forEach(object => {
            if (object.mesh && object.material) {
                gl.bindVertexArray(object.mesh.vao);
                gl.drawElements(gl.TRIANGLES, object.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            }
        });
    }
}
