import { CanvasManager } from './CanvasManager.js';
import { Matrix4 } from '../datatypes/Matrix4.js';
import { ShaderManager } from './ShaderManager.js';
import { Sky } from './Sky.js';
import { Culling } from '../utils/Culling.js';
import { VoxelBufferPool } from './VoxelBufferPool.js';

export class WebGLRenderer {
    constructor(canvas = null) {
        this.canvas = canvas || CanvasManager.createFullscreenCanvas();
        this.gl = this.initWebGL2(this.canvas);

        if (!this.gl) {
            throw new Error('WebGL 2 is not supported or failed to initialize');
        }

        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();
        this.modelMatrix = new Matrix4();

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.shaderManager = new ShaderManager(this.gl);
        this.voxelBufferPool = new VoxelBufferPool(this.gl);

        this.culling = new Culling();

        this.lightDirection = [1.5, -2.0, 0.5];
        this.lightColor = [1.0, 1.0, 1.0];
        this.ambientStrength = 0.5;

        this.config = {
            enableAO: true,
            enableLighting: true,
            lightDirection: [0.5, -0.1, 0.5],
            lightColor: [1.0, 1.0, 1.0],
            ambientStrength: 0.5
        };

        this.wireframeMode = false;
        this.sky = new Sky();
        this.gl.clearColor(0.098, 0.098, 0.098, 1.0);

        this.vao = this.gl.createVertexArray();

        this.resize();
    }

    initWebGL2(canvas) {
        try {
            return canvas.getContext('webgl2');
        } catch(e) {
            console.error('Error initializing WebGL2:', e);
            return null;
        }
    }

    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        }
    }

    render(scene, camera) {
        if (!scene || !camera) return;

        const gl = this.gl;

        this.sky.update(this, camera);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        const program = this.shaderManager.use();
        camera.update();
        const { uniforms, attributes } = program;

        if (uniforms.uProjectionMatrix) {
            gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projectionMatrix.elements);
        }
        if (uniforms.uViewMatrix) {
            gl.uniformMatrix4fv(uniforms.uViewMatrix, false, camera.viewMatrix.elements);
        }
        if (uniforms.uModelMatrix) {
            this.modelMatrix.identity();
            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, this.modelMatrix.elements);
        }

        this.updateSharedUniforms(camera);
        this.culling.updateFrustumPlanes(camera);

        const visibleChunks = this.getVisibleChunks(scene);
        console.log(`Rendering ${visibleChunks.length} visible chunks.`);

        gl.bindVertexArray(this.vao);
        for (const chunk of visibleChunks) {
            this.renderChunk(chunk, attributes, scene.world);
        }
        gl.bindVertexArray(null);
    }

    renderChunk(chunk, attributes, world) {
        const gl = this.gl;
        let renderData = chunk._renderDataCache;

        if (chunk.isDirty) {
            renderData = chunk.generateRenderData(world);
            if (renderData) {
                this.voxelBufferPool.updateBuffer(chunk, renderData);
            }
            chunk.isDirty = false;
        }

        if (!renderData) return;

        const buffers = this.voxelBufferPool.getBuffer(chunk);
        if (!buffers || buffers.elementCount === 0) return;

        this.setupAttributes(attributes, buffers);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
        gl.drawElements(this.wireframeMode ? gl.LINES : gl.TRIANGLES, buffers.elementCount, gl.UNSIGNED_INT, 0);
    }
    
    setupAttributes(attributes, buffers) {
        const gl = this.gl;

        this.bindAttribute(attributes.position, buffers.vertexBuffer, 3);
        this.bindAttribute(attributes.normal, buffers.normalBuffer, 3);
        this.bindAttribute(attributes.color, buffers.colorBuffer, 4);
        this.bindAttribute(attributes.uv, buffers.uvBuffer, 2);
    }

    bindAttribute(location, buffer, size, type = this.gl.FLOAT, normalized = false, stride = 0, offset = 0) {
        const gl = this.gl;
        if (location !== undefined && buffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        }
    }

    dispose() {
        this.voxelBufferPool.dispose();
        this.gl.deleteVertexArray(this.vao);
    }

    updateSharedUniforms(camera) {
        const gl = this.gl;
        const uniforms = this.shaderManager.getCurrentProgram().uniforms;

        if (uniforms.uLightDirection) {
            gl.uniform3fv(uniforms.uLightDirection, this.config.lightDirection);
        }
        if (uniforms.uLightColor) {
            gl.uniform3fv(uniforms.uLightColor, this.config.lightColor);
        }
        if (uniforms.uAmbientStrength) {
            gl.uniform1f(uniforms.uAmbientStrength, this.config.ambientStrength);
        }
        if (uniforms.uEnableLighting) {
            gl.uniform1i(uniforms.uEnableLighting, this.config.enableLighting);
        }
    }

    getVisibleChunks(scene) {
        const visible = [];
        if (!scene.world) return visible;

        for (const chunk of scene.world.chunkPool.values()) {
            if (!chunk.visible) continue;

            const box = {
                min: [chunk.x * chunk.size, chunk.y * chunk.size, chunk.z * chunk.size],
                max: [(chunk.x + 1) * chunk.size, (chunk.y + 1) * chunk.size, (chunk.z + 1) * chunk.size]
            };

            if (!this.culling.isCulled(box)) {
                visible.push(chunk);
            }
        }
        return visible;
    }

    setWireframeMode(enabled) {
        this.wireframeMode = enabled;
    }
}