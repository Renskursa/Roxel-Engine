import { DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER } from '../shaders/DefaultShaders.js';

export class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaders = new Map();
        this.currentProgram = null;
        this.engineDefaultProgram = this.createProgram('engine_default', DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER);
        this.defaultProgram = this.engineDefaultProgram;  // This can be overridden by game shaders
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            throw new Error('Shader compilation error: ' + info);
        }

        return shader;
    }

    createProgram(name, vertexSource, fragmentSource) {
        const program = this.gl.createProgram();
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            throw new Error('Program linking error: ' + info);
        }

        // Store program info
        const programInfo = {
            program: program,
            attributes: this.getAttributes(program),
            uniforms: this.getUniforms(program)
        };

        this.shaders.set(name, programInfo);
        return programInfo;
    }

    getAttributes(program) {
        const attributes = {};
        const numAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        
        for (let i = 0; i < numAttributes; i++) {
            const info = this.gl.getActiveAttrib(program, i);
            attributes[info.name] = this.gl.getAttribLocation(program, info.name);
        }
        
        return attributes;
    }

    getUniforms(program) {
        const uniforms = {};
        const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        
        for (let i = 0; i < numUniforms; i++) {
            const info = this.gl.getActiveUniform(program, i);
            uniforms[info.name] = this.gl.getUniformLocation(program, info.name);
        }
        
        return uniforms;
    }

    setDefaultProgram(name) {
        const program = this.shaders.get(name);
        if (program) {
            this.defaultProgram = program;
        }
        return this.defaultProgram;
    }

    resetToEngineDefault() {
        this.defaultProgram = this.engineDefaultProgram;
    }

    use(name = null) {
        // If no name provided, use current default (game shader or engine default)
        if (!name) {
            this.currentProgram = this.defaultProgram;
        } else {
            const program = this.shaders.get(name);
            if (!program) {
                console.warn(`Shader program '${name}' not found, using default`);
                this.currentProgram = this.defaultProgram;
            } else {
                this.currentProgram = program;
            }
        }
        
        this.gl.useProgram(this.currentProgram.program);
        return this.currentProgram;
    }

    getCurrentProgram() {
        return this.currentProgram;
    }

    getProgram(name) {
        return this.shaders.get(name) || this.defaultProgram;
    }
}
