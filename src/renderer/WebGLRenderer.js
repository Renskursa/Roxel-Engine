import { Matrix4 } from '../datatypes/Matrix4.js';
import { RenderBatch } from './RenderBatch.js';

// Add basic shadow shader sources as fallback
const defaultShadowVertexShader = `#version 300 es
in vec3 position;
uniform mat4 lightSpaceMatrix;
uniform mat4 modelMatrix;
void main() {
    gl_Position = lightSpaceMatrix * modelMatrix * vec4(position, 1.0);
}`;

const defaultShadowFragmentShader = `#version 300 es
precision highp float;
void main() {
}`;

export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        // Optimize WebGL context creation for performance
        this.gl = canvas.getContext('webgl2', {
            antialias: false, // Disable for better performance
            depth: true,      // Enable depth testing
            stencil: false,   // Disable unused stencil buffer
            alpha: false,     // Disable alpha for better performance
            powerPreference: 'high-performance'
        });
        
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        
        this.init();
        this.wireframeMode = false;
        this.lastProgram = null;

        this.shadowMapSize = 2048;
        this.shadowMapEnabled = true;
        this.shadowFramebuffer = this.createFramebuffer(this.shadowMapSize, this.shadowMapSize);
        this.shadowDepthTexture = this.createDepthTexture(this.shadowMapSize, this.shadowMapSize);
        this.lightingSystem = null; // Add this line
        
        // Attach depth texture to framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadowFramebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.shadowDepthTexture, 0);

        // Use default shadow shaders if custom ones aren't provided
        this.shadowShaderProgram = this.createShaderProgram(
            defaultShadowVertexShader,
            defaultShadowFragmentShader
        );

        // Add automated resource management
        this.resourceCache = new Map();
        this.batchManager = new BatchManager(this.gl);
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            vertices: 0
        };
        
        // Initialize default shadow mapping system
        this.initializeShadowSystem();
    }

    initializeShadowSystem() {
        // ...existing shadow setup code...
        this.defaultShadowConfig = {
            size: 2048,
            near: 1,
            far: 512,
            bias: 0.005,
            softness: 2.0
        };
    }

    init() {
        const gl = this.gl;
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);

        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('OES_texture_float_linear');
    }

    setWireframeMode(enabled) {
        this.wireframeMode = enabled;
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const program = this.gl.createProgram();
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Shader linking failed: ' + this.gl.getProgramInfoLog(program));
        }

        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);

        return program;
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('Shader compilation error: ' + this.gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    createBuffer(data, target = this.gl.ARRAY_BUFFER) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferData(target, data, this.gl.STATIC_DRAW);
        return buffer;
    }

    createFramebuffer(width, height) {
        const gl = this.gl;
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        return framebuffer;
    }

    createDepthTexture(width, height) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT24,
            width,
            height,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_INT,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }

    beginFrame() {
        this.stats.drawCalls = 0;
        this.stats.triangles = 0;
        this.stats.vertices = 0;
        this.batchManager.reset();
    }

    endFrame() {
        this.batchManager.flush();
    }

    addToBatch(object) {
        return this.batchManager.add(object);
    }

    getResource(key) {
        return this.resourceCache.get(key);
    }

    setResource(key, resource) {
        if (this.resourceCache.has(key)) {
            this.deleteResource(key);
        }
        this.resourceCache.set(key, resource);
    }

    deleteResource(key) {
        const resource = this.resourceCache.get(key);
        if (resource) {
            if (resource instanceof WebGLBuffer) {
                this.gl.deleteBuffer(resource);
            } else if (resource instanceof WebGLTexture) {
                this.gl.deleteTexture(resource);
            }
            this.resourceCache.delete(key);
        }
    }

    render(scene, camera) {
        this.beginFrame();

        if (this.shadowMapEnabled && this.lightingSystem?.lights[0]) {
            // Render shadow map first
            this.renderShadowMap(scene);
        }

        this.clear();

        const renderableObjects = scene.objects.filter(obj => obj.mesh && obj.material);
        
        // Sort objects by shader program to minimize state changes
        renderableObjects.sort((a, b) => (a.material.program - b.material.program));

        let currentProgram = null;

        renderableObjects.forEach(object => {
            if (!object.position) return;

            if (object.material.program !== currentProgram) {
                currentProgram = object.material.program;
                this.gl.useProgram(currentProgram);
                this.setupLighting(currentProgram);
            }

            this.renderObject(object, camera);

            if (this.wireframeMode && object.mesh.edgeBuffer) {
                this.renderWireframe(object, camera);
            }
        });

        this.endFrame();
    }

    renderShadowMap(scene) {
        const gl = this.gl;
        const light = this.lightingSystem.lights[0];
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);
        gl.viewport(0, 0, this.shadowMapSize, this.shadowMapSize);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        
        // Use shadow shader program and render scene from light's perspective
        const renderableObjects = scene.objects.filter(obj => obj.mesh && obj.material);
        
        renderableObjects.forEach(object => {
            if (!object.position) return;
            this.renderObjectToShadowMap(object, light);
        });
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    renderObjectToShadowMap(object, light) {
        const gl = this.gl;
        gl.useProgram(this.shadowShaderProgram);

        this.setupAttribute(this.shadowShaderProgram, object.mesh.vertexBuffer, 'position', 3);

        const modelMatrix = new Matrix4()
            .translate(object.position.x, object.position.y, object.position.z)
            .rotateX(object.rotation.x)
            .rotateY(object.rotation.y)
            .rotateZ(object.rotation.z);

        this.setUniformMatrix(this.shadowShaderProgram, 'modelMatrix', modelMatrix);
        this.setUniformMatrix(this.shadowShaderProgram, 'lightSpaceMatrix', light.shadowMatrix);

        if (object.mesh.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.mesh.indexBuffer);
            gl.drawElements(gl.TRIANGLES, object.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, object.mesh.vertexCount);
        }
    }

    setupLighting(program) {
        if (!this.lightingSystem) return;

        const gl = this.gl;
        const mainLight = this.lightingSystem.lights[0] || {
            direction: [0, -1, 0],
            color: [1, 1, 1],
            intensity: 1.0
        };

        // Normalize light direction for consistent lighting
        const dir = mainLight.direction;
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
        const normalizedDir = [dir.x / len, dir.y / len, dir.z / len];

        const uniforms = {
            lightDirection: gl.getUniformLocation(program, 'lightDirection'),
            lightColor: gl.getUniformLocation(program, 'lightColor'),
            lightIntensity: gl.getUniformLocation(program, 'lightIntensity'),
            ambientLight: gl.getUniformLocation(program, 'ambientLight'),
            cameraPosition: gl.getUniformLocation(program, 'cameraPosition')
        };

        if (uniforms.lightDirection) {
            gl.uniform3fv(uniforms.lightDirection, new Float32Array(normalizedDir));
        }
        if (uniforms.lightColor) {
            gl.uniform3fv(uniforms.lightColor, new Float32Array(mainLight.color));
        }
        if (uniforms.lightIntensity) {
            gl.uniform1f(uniforms.lightIntensity, mainLight.intensity);
        }
        if (uniforms.ambientLight) {
            gl.uniform3fv(uniforms.ambientLight, new Float32Array(this.lightingSystem.ambientLight.color));
        }
    }

    renderObject(object, camera) {
        const gl = this.gl;
        const program = object.material?.program;
        if (!program) return;
        
        gl.useProgram(program);

        // Set object-specific uniforms first
        if (object.material.uniforms) {
            for (const [name, uniform] of Object.entries(object.material.uniforms)) {
                this.setUniform(program, name, uniform);
            }
        }

        this.setupAttribute(program, object.mesh.vertexBuffer, 'position', 3);
        this.setupAttribute(program, object.mesh.colorBuffer, 'color', 4);
        this.setupAttribute(program, object.mesh.normalBuffer, 'normal', 3);

        const modelMatrix = new Matrix4()
            .translate(object.position.x, object.position.y, object.position.z)
            .rotateX(object.rotation.x)
            .rotateY(object.rotation.y)
            .rotateZ(object.rotation.z);

        const modelViewMatrix = camera.getViewMatrix().multiply(modelMatrix);

        this.setUniformMatrix(program, 'modelViewMatrix', modelViewMatrix);
        this.setUniformMatrix(program, 'modelMatrix', modelMatrix);
        this.setUniformMatrix(program, 'projectionMatrix', camera.getProjectionMatrix());

        // Add shadow map binding
        if (this.shadowMapEnabled && this.lightingSystem?.lights[0]) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowDepthTexture);
            gl.uniform1i(gl.getUniformLocation(program, 'shadowMap'), 0);
            this.setUniformMatrix(program, 'lightSpaceMatrix', this.lightingSystem.lights[0].shadowMatrix);
        }

        if (object.mesh.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.mesh.indexBuffer);
            gl.drawElements(gl.TRIANGLES, object.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, object.mesh.vertexCount);
        }
    }

    setupAttribute(program, buffer, name, size) {
        const gl = this.gl;
        const location = gl.getAttribLocation(program, name);
        if (location !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        }
    }

    setUniformMatrix(program, name, matrix) {
        const location = this.gl.getUniformLocation(program, name);
        if (location) {
            this.gl.uniformMatrix4fv(location, false, matrix.elements);
        }
    }

    setUniform(program, name, value) {
        const gl = this.gl;
        const location = gl.getUniformLocation(program, name);
        if (!location) return;

        // Support for object-style uniforms
        const actualValue = value?.value !== undefined ? value.value : value;

        if (Array.isArray(actualValue)) {
            switch (actualValue.length) {
                case 2:
                    gl.uniform2f(location, actualValue[0], actualValue[1]);
                    break;
                case 3:
                    gl.uniform3f(location, actualValue[0], actualValue[1], actualValue[2]);
                    break;
                case 4:
                    gl.uniform4f(location, actualValue[0], actualValue[1], actualValue[2], actualValue[3]);
                    break;
                case 16:
                    gl.uniformMatrix4fv(location, false, actualValue);
                    break;
                default:
                    console.warn(`Unsupported uniform array length: ${actualValue.length}`);
            }
        } else if (typeof actualValue === 'number') {
            gl.uniform1f(location, actualValue);
        } else if (typeof actualValue === 'boolean') {
            gl.uniform1i(location, actualValue ? 1 : 0);
        }
    }

    renderWireframe(object, camera) {
        const gl = this.gl;

        if (!this.wireframeShader) {
            this.wireframeShader = this.createShaderProgram(
                `#version 300 es
                in vec3 position;
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,
                `#version 300 es
                precision mediump float;
                out vec4 fragColor;
                void main() {
                    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
                }`
            );
        }

        gl.useProgram(this.wireframeShader);

        const modelMatrix = new Matrix4()
            .translate(object.position.x, object.position.y, object.position.z)
            .rotateX(object.rotation.x)
            .rotateY(object.rotation.y)
            .rotateZ(object.rotation.z);

        const modelViewMatrix = camera.getViewMatrix().multiply(modelMatrix);

        this.setUniformMatrix(this.wireframeShader, 'modelViewMatrix', modelViewMatrix);
        this.setUniformMatrix(this.wireframeShader, 'projectionMatrix', camera.getProjectionMatrix());

        gl.bindBuffer(gl.ARRAY_BUFFER, object.mesh.edgeBuffer);
        const positionLoc = gl.getAttribLocation(this.wireframeShader, 'position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.lineWidth(1.0);
        gl.drawArrays(gl.LINES, 0, object.mesh.edgeCount);
        gl.depthFunc(gl.LESS);
    }

    setLightingSystem(lightingSystem) {  // Add this method
        this.lightingSystem = lightingSystem;
    }
}

class BatchManager {
    constructor(gl) {
        this.gl = gl;
        this.batches = new Map();
        this.maxBatchSize = 65536; // Adjust based on your needs
    }

    reset() {
        this.batches.clear();
    }

    add(object) {
        const key = this.getBatchKey(object);
        let batch = this.batches.get(key);
        
        if (!batch || batch.isFull()) {
            batch = new RenderBatch(this.gl, this.maxBatchSize);
            this.batches.set(key, batch);
        }

        return batch.add(object);
    }

    flush() {
        this.batches.forEach(batch => batch.render());
    }

    getBatchKey(object) {
        return `${object.material.program}_${object.material.texture || 'null'}`;
    }
}
