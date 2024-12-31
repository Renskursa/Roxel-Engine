import { Matrix4 } from '../datatypes/Matrix4.js';

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

    render(scene, camera) {
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
    }

    setupLighting(program) {
        if (!this.lightingSystem) return;

        const gl = this.gl;
        const mainLight = this.lightingSystem.lights[0] || {
            direction: [0, -1, 0],
            color: [1, 1, 1],
            intensity: 1.0
        };

        const uniforms = {
            lightDirection: gl.getUniformLocation(program, 'lightDirection'),
            lightColor: gl.getUniformLocation(program, 'lightColor'),
            lightIntensity: gl.getUniformLocation(program, 'lightIntensity'),
            ambientLight: gl.getUniformLocation(program, 'ambientLight')
        };

        if (uniforms.lightDirection) {
            gl.uniform3fv(uniforms.lightDirection, new Float32Array(Object.values(mainLight.direction)));
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
        const program = object.material?.program || this.defaultShaderProgram;
        
        gl.useProgram(program);

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
}
