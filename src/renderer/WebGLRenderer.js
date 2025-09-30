import { CanvasManager } from './CanvasManager';
import { Matrix4 } from '../datatypes/Matrix4';
import { ShaderManager } from './ShaderManager';
import { Sky } from './Sky.js';
import { Culling } from '../utils/Culling.js';
import { CUBE_VERTICES, CUBE_INDICES, CUBE_NORMALS, WIREFRAME_INDICES } from './CubeGeometry.js';

export class WebGLRenderer {
  constructor(canvas = null) {
    this.canvas = canvas || CanvasManager.createFullscreenCanvas();
    this.gl = this.initWebGL2(this.canvas);
    
    if (!this.gl) {
      throw new Error('WebGL 2 is not supported or failed to initialize');
    }
    
    // Initialize matrices
    this.projectionMatrix = new Matrix4();
    this.viewMatrix = new Matrix4();
    this.modelMatrix = new Matrix4();
    
    // Set up GL state
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    // Remove extension checks since they're built into WebGL2
    this.ext = {
        depthTexture: true, // Built into WebGL2
        ubo: true          // Built into WebGL2
    };

    // Initialize shader manager first
    this.shaderManager = new ShaderManager(this.gl);
    
    // Create shared geometry AFTER shader initialization
    this.initializeSharedGeometry();
    
    // Initialize remaining properties
    this.maxBatchSize = 65536;
    this.staticBuffers = new Map();
    this.culling = new Culling();
    this.sharedUniforms = {
        buffer: this.gl.createBuffer(),
        data: new Float32Array(16 * 3)
    };

    // Adjust lighting for more subtle shadows
    this.lightDirection = [1.5, -2.0, 0.5];
    this.lightColor = [1.0, 1.0, 1.0];
    this.ambientStrength = 0.5; // Increased ambient light to reduce contrast

    // Add rendering configuration
    this.config = {
        enableAO: true,
        enableLighting: true,
        lightDirection: [0.5, -0.1, 0.5],
        lightColor: [1.0, 1.0, 1.0],
        ambientStrength: 0.5
    };

    // Add wireframe state
    this.wireframeMode = false;

    // Add wireframe buffer
    this.wireframeBuffer = null;

    // Add sky system
    this.sky = new Sky();

    // Set clear color to match void color initially
    this.gl.clearColor(0.098, 0.098, 0.098, 1.0);

    // Add instance batching configuration
    this.maxInstancesPerBatch = 2048;
    this.instanceDataStride = 8; // floats per instance (3 pos + 4 color + 1 ao)
    this.instanceBufferSize = this.maxInstancesPerBatch * this.instanceDataStride;
    
    // Preallocate reusable instance data array
    this.sharedInstanceData = new Float32Array(this.instanceBufferSize);

    this.renderQueue = [];

    this.resize();
  }

  initWebGL2(canvas) {
    let gl = null;
    try {
        gl = canvas.getContext('webgl2');
        if (gl) {
            // Enable wireframe mode support
            this.wireframeSupported = true;
        }
    } catch(e) {
        console.error('Error initializing WebGL2:', e);
    }
    return gl;
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
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Set polygon mode based on wireframe state
    if (this.wireframeMode) {
        gl.polygonMode?.(gl.FRONT_AND_BACK, gl.LINE);
    } else {
        gl.polygonMode?.(gl.FRONT_AND_BACK, gl.FILL);
    }

    // Use the shader program through ShaderManager
    const program = this.shaderManager.use();

    // Set up matrices using the program info from ShaderManager
    camera.update();
    const { uniforms } = program;

    if (uniforms.uProjectionMatrix && camera.projectionMatrix) {
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projectionMatrix.elements);
    }
    
    if (uniforms.uViewMatrix && camera.viewMatrix) {
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, camera.viewMatrix.elements);
    }

    if (uniforms.uModelMatrix) {
        this.modelMatrix.identity();
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, this.modelMatrix.elements);
    }


    // Update shared uniforms
    this.updateSharedUniforms(camera);
    
    // Update frustum planes for culling
    this.culling.updateFrustumPlanes(camera);

    // Sort objects by material/shader to minimize state changes
    if (scene.isDirty || scene.world.isDirty) {
        this.renderQueue = this.sortRenderQueue(scene);
        scene.isDirty = false;
        scene.world.isDirty = false;
    }

    // Batch similar objects together
    for (const batch of this.renderQueue) {
        this.renderBatch(batch);
    }
  }

  renderBatch(batch) {
    const gl = this.gl;
    const { program, uniforms, instances } = batch;

    if (!instances || instances.length === 0) return;

    try {
        gl.useProgram(program);
        gl.bindVertexArray(this.sharedGeometry.vao);

        // Split instances into smaller batches
        for (let i = 0; i < instances.length; i += this.maxInstancesPerBatch) {
            const batchInstances = instances.slice(i, i + this.maxInstancesPerBatch);
            const instanceCount = batchInstances.length;

            // Reuse shared instance data array
            let offset = 0;
            for (const instance of batchInstances) {
                // Position
                this.sharedInstanceData[offset++] = instance.position[0];
                this.sharedInstanceData[offset++] = instance.position[1];
                this.sharedInstanceData[offset++] = instance.position[2];
                
                // Color
                if (this.wireframeMode) {
                    this.sharedInstanceData[offset++] = 1;
                    this.sharedInstanceData[offset++] = 1;
                    this.sharedInstanceData[offset++] = 1;
                    this.sharedInstanceData[offset++] = 1;
                } else {
                    this.sharedInstanceData[offset++] = instance.color[0];
                    this.sharedInstanceData[offset++] = instance.color[1];
                    this.sharedInstanceData[offset++] = instance.color[2];
                    this.sharedInstanceData[offset++] = instance.color[3];
                }
                
                // AO
                this.sharedInstanceData[offset++] = instance.ao || 1.0;
            }

            // Upload only the data we need
            const usedData = new Float32Array(
                this.sharedInstanceData.buffer,
                0,
                instanceCount * this.instanceDataStride
            );

            gl.bindBuffer(gl.ARRAY_BUFFER, this.sharedGeometry.instanceBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, usedData, gl.DYNAMIC_DRAW);

            if (this.wireframeMode) {
                // Draw solid faces first (back faces only)
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sharedGeometry.indexBuffer);
                gl.drawElementsInstanced(
                    gl.TRIANGLES,
                    this.sharedGeometry.count,
                    gl.UNSIGNED_SHORT,
                    0,
                    instanceCount
                );

                // Then draw wireframe on top with depth test but no depth write
                gl.depthMask(false);
                gl.disable(gl.CULL_FACE);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sharedGeometry.wireframeBuffer);
                gl.drawElementsInstanced(
                    gl.LINES,
                    this.sharedGeometry.wireframeCount,
                    gl.UNSIGNED_SHORT,
                    0,
                    instanceCount
                );
                gl.depthMask(true);
            } else {
                // Normal solid rendering
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sharedGeometry.indexBuffer);
                gl.drawElementsInstanced(
                    gl.TRIANGLES,
                    this.sharedGeometry.count,
                    gl.UNSIGNED_SHORT,
                    0,
                    instanceCount
                );
            }
        }

    } catch (error) {
        console.error('Error in renderBatch:', error);
        throw error;
    } finally {
        // Restore states
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        gl.depthMask(true);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
  }

  initializeSharedGeometry() {
    const gl = this.gl;
    const program = this.shaderManager.defaultProgram;
    
    if (!program || !program.attributes) {
        throw new Error('Shader program not properly initialized');
    }

    try {
        // Create VAO using native WebGL2
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // 1. Setup vertex buffer with fixed stride and interleaved data
        const vertexStride = 24; // 6 floats (3 for position, 3 for normal)
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Interleave position and normal data
        const interleavedData = new Float32Array(CUBE_VERTICES.length * 2);
        for (let i = 0; i < CUBE_VERTICES.length; i += 3) {
            const vertexIdx = (i / 3) * 6;
            // Position
            interleavedData[vertexIdx] = CUBE_VERTICES[i];
            interleavedData[vertexIdx + 1] = CUBE_VERTICES[i + 1];
            interleavedData[vertexIdx + 2] = CUBE_VERTICES[i + 2];
            // Normal
            interleavedData[vertexIdx + 3] = CUBE_NORMALS[i];
            interleavedData[vertexIdx + 4] = CUBE_NORMALS[i + 1];
            interleavedData[vertexIdx + 5] = CUBE_NORMALS[i + 2];
        }
        gl.bufferData(gl.ARRAY_BUFFER, interleavedData, gl.STATIC_DRAW);

        // 2. Setup attributes with correct strides and offsets
        const positionLoc = program.attributes.position;
        const normalLoc = program.attributes.normal;
        
        if (positionLoc !== undefined) {
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, vertexStride, 0);
        }
        
        if (normalLoc !== undefined) {
            gl.enableVertexAttribArray(normalLoc);
            gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, vertexStride, 12);
        }

        // 3. Setup instance buffer with correct size and stride
        const instanceStride = 32; // 8 floats (3 pos + 4 color + 1 ao)
        const instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        
        // Allocate larger buffer for instances
        const maxInstances = 10000; // Increase if needed
        gl.bufferData(gl.ARRAY_BUFFER, maxInstances * instanceStride, gl.DYNAMIC_DRAW);

        const instancePosLoc = program.attributes.instancePosition;
        const instanceColorLoc = program.attributes.instanceColor;
        const aoLoc = program.attributes.ao;

        // Update instance attribute setup for WebGL2
        if (instancePosLoc !== undefined) {
            gl.enableVertexAttribArray(instancePosLoc);
            gl.vertexAttribPointer(instancePosLoc, 3, gl.FLOAT, false, instanceStride, 0);
            gl.vertexAttribDivisor(instancePosLoc, 1);  // Native instancing
        }

        if (instanceColorLoc !== undefined) {
            gl.enableVertexAttribArray(instanceColorLoc);
            gl.vertexAttribPointer(instanceColorLoc, 4, gl.FLOAT, false, instanceStride, 12);
            gl.vertexAttribDivisor(instanceColorLoc, 1);
        }

        if (aoLoc !== undefined) {
            gl.enableVertexAttribArray(aoLoc);
            gl.vertexAttribPointer(aoLoc, 1, gl.FLOAT, false, instanceStride, 28);
            gl.vertexAttribDivisor(aoLoc, 1);
        }

        // 4. Setup index buffer
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

        // Add wireframe index buffer
        const wireframeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireframeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, WIREFRAME_INDICES, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.sharedGeometry = {
            vao,
            vertexBuffer,
            indexBuffer,
            instanceBuffer,
            count: CUBE_INDICES.length,
            maxInstances,
            wireframeBuffer,
            wireframeCount: WIREFRAME_INDICES.length
        };

    } catch (error) {
        console.error('Error in initializeSharedGeometry:', error);
        throw error;
    }
  }

  // Add cleanup method
  dispose() {
    const gl = this.gl;
    for (const buffers of this.staticBuffers.values()) {
        gl.deleteBuffer(buffers.vertex);
        gl.deleteBuffer(buffers.color);
        gl.deleteBuffer(buffers.index);
    }
    this.staticBuffers.clear();
  }

  updateSharedUniforms(camera) {
    const gl = this.gl;
    const uniforms = this.shaderManager.getCurrentProgram().uniforms;

    // Update projection and view matrices
    if (uniforms.uProjectionMatrix && camera.projectionMatrix) {
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projectionMatrix.elements);
    }
    
    if (uniforms.uViewMatrix && camera.viewMatrix) {
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, camera.viewMatrix.elements);
    }

    // Update UBO if supported
    if (this.ext.ubo) {
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.sharedUniforms.buffer);
        this.sharedUniforms.data.set(camera.projectionMatrix.elements, 0);
        this.sharedUniforms.data.set(camera.viewMatrix.elements, 16);
        gl.bufferData(gl.UNIFORM_BUFFER, this.sharedUniforms.data, gl.DYNAMIC_DRAW);
    }

    // Add light direction uniform
    if (uniforms.lightDirection) {
        gl.uniform3fv(uniforms.lightDirection, [0.7, 1.0, 0.5]); // More pronounced angle
    }

    // Update lighting uniforms
    if (uniforms.uLightDirection) {
        gl.uniform3fv(uniforms.uLightDirection, this.lightDirection);
    }
    if (uniforms.uLightColor) {
        gl.uniform3fv(uniforms.uLightColor, this.lightColor);
    }
    if (uniforms.uAmbientStrength) {
        gl.uniform1f(uniforms.uAmbientStrength, this.ambientStrength);
    }

    // Update configuration uniforms
    if (uniforms.uEnableAO) {
        gl.uniform1i(uniforms.uEnableAO, this.config.enableAO);
    }
    if (uniforms.uEnableLighting) {
        gl.uniform1i(uniforms.uEnableLighting, this.config.enableLighting);
    }
    if (this.config.enableLighting) {
        if (uniforms.uLightDirection) {
            gl.uniform3fv(uniforms.uLightDirection, this.config.lightDirection);
        }
        if (uniforms.uLightColor) {
            gl.uniform3fv(uniforms.uLightColor, this.config.lightColor);
        }
        if (uniforms.uAmbientStrength) {
            gl.uniform1f(uniforms.uAmbientStrength, this.config.ambientStrength);
        }
    }

  }


  sortRenderQueue(scene) {
    const queue = new Map();
    const objects = [...(scene.world ? Array.from(scene.world.chunkPool.values()) : []), ...(scene.children || [])];
    
    for (const obj of objects) {
        if (!obj?.visible) continue;
        
        // Frustum culling for chunks
        if (obj.x !== undefined && obj.y !== undefined && obj.z !== undefined) {
            const box = {
                min: [obj.x * obj.size, obj.y * obj.size, obj.z * obj.size],
                max: [(obj.x + 1) * obj.size, (obj.y + 1) * obj.size, (obj.z + 1) * obj.size]
            };
            if (this.culling.isCulled(box)) {
                continue;
            }
        }

        const renderData = obj.generateRenderData?.();
        if (!renderData?.instances?.length) continue;
        
        const key = obj.material?.id || 'default';
        if (!queue.has(key)) {
            // Use correct shader program based on material id
            const program = this.shaderManager.getProgram(key);
            queue.set(key, {
                program: program.program,
                uniforms: program.uniforms,
                instances: []
            });
        }
        
        queue.get(key).instances.push(...renderData.instances);
    }
    
    return Array.from(queue.values());
  }

  setWireframeMode(enabled) {
    this.wireframeMode = enabled;
    const gl = this.gl;

    if (enabled) {
        gl.lineWidth(1.0);
    }
  }
}