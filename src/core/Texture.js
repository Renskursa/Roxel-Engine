export class Texture {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.target = options.target || gl.TEXTURE_2D;
        this.format = options.format || gl.RGBA;
        this.internalFormat = options.internalFormat || gl.RGBA;
        this.type = options.type || gl.UNSIGNED_BYTE;
        this.attachment = options.attachment || gl.COLOR_ATTACHMENT0;
        this.texture = gl.createTexture();
    }

    bind(unit = 0) {
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.target, this.texture);
    }

    unbind() {
        this.gl.bindTexture(this.target, null);
    }

    fromSize(width, height) {
        this.bind();
        this.gl.texImage2D(
            this.target,
            0,
            this.internalFormat,
            width,
            height,
            0,
            this.format,
            this.type,
            null
        );
        return this;
    }

    fromImage(image) {
        this.bind();
        this.gl.texImage2D(
            this.target,
            0,
            this.internalFormat,
            this.format,
            this.type,
            image
        );
        return this;
    }

    setParameters(parameters) {
        this.bind();
        for (const [key, value] of Object.entries(parameters)) {
            this.gl.texParameteri(this.target, this.gl[key], this.gl[value]);
        }
    }

    generateMipmaps() {
        this.bind();
        this.gl.generateMipmap(this.target);
    }
}