export class Sky {
    constructor() {
        this.skyColor = { r: 0.529, g: 0.808, b: 0.922, a: 1.0 };  // Light blue sky
        this.horizonColor = { r: 0.878, g: 0.933, b: 0.961, a: 1.0 }; // Lighter blue horizon
        this.voidColor = { r: 0.098, g: 0.098, b: 0.098, a: 1.0 };  // Dark void
        this.fogColor = { r: 0.8, g: 0.9, b: 1.0, a: 1.0 };
        this.fogDensity = 0.00125;
        this.fogStart = 100.0;
        this.fogEnd = 500.0;
        this.enableFog = true;  // Add fog toggle
    }

    setSkyColor(r, g, b, a = 1.0) {
        this.skyColor = { r, g, b, a };
    }

    setHorizonColor(r, g, b, a = 1.0) {
        this.horizonColor = { r, g, b, a };
    }

    setVoidColor(r, g, b, a = 1.0) {
        this.voidColor = { r, g, b, a };
    }

    setFogColor(r, g, b, a = 1.0) {
        this.fogColor = { r, g, b, a };
    }

    setFogDensity(density) {
        this.fogDensity = density;
    }

    setFogDistance(start, end) {
        this.fogStart = start;
        this.fogEnd = end;
    }

    setFogEnabled(enabled) {
        this.enableFog = enabled;
    }

    // Get color at specific height (for smooth gradient)
    getColorAtHeight(height) {
        const skyHeight = 60; // Height where sky color is fully visible
        const voidHeight = 0; // Height where void color is fully visible

        if (height > skyHeight) {
            return this.skyColor;
        } else if (height < voidHeight) {
            return this.voidColor;
        } else {
            // Interpolate between colors
            const t = (height - voidHeight) / (skyHeight - voidHeight);
            return {
                r: this.lerp(this.horizonColor.r, this.skyColor.r, t),
                g: this.lerp(this.horizonColor.g, this.skyColor.g, t),
                b: this.lerp(this.horizonColor.b, this.skyColor.b, t),
                a: 1.0
            };
        }
    }

    update(renderer, camera) {
        const clearColor = this.getColorAtHeight(camera.position.y);
        renderer.gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);

        const program = renderer.shaderManager.getCurrentProgram();
        if (!program) return;

        const { uniforms } = program;

        if (uniforms.uSkyColor) {
            renderer.gl.uniform4f(uniforms.uSkyColor, this.skyColor.r, this.skyColor.g, this.skyColor.b, this.skyColor.a);
        }
        if (uniforms.uVoidColor) {
            renderer.gl.uniform4f(uniforms.uVoidColor, this.voidColor.r, this.voidColor.g, this.voidColor.b, this.voidColor.a);
        }
        if (uniforms.uHorizonColor) {
            renderer.gl.uniform4f(uniforms.uHorizonColor, this.horizonColor.r, this.horizonColor.g, this.horizonColor.b, this.horizonColor.a);
        }
        if (uniforms.uEnableFog) {
            renderer.gl.uniform1i(uniforms.uEnableFog, this.enableFog);
        }
        if (this.enableFog) {
            if (uniforms.uFogColor) {
                renderer.gl.uniform4f(uniforms.uFogColor, this.fogColor.r, this.fogColor.g, this.fogColor.b, this.fogColor.a);
            }
            if (uniforms.uFogDensity) {
                renderer.gl.uniform1f(uniforms.uFogDensity, this.fogDensity);
            }
            if (uniforms.uFogStart) {
                renderer.gl.uniform1f(uniforms.uFogStart, this.fogStart);
            }
            if (uniforms.uFogEnd) {
                renderer.gl.uniform1f(uniforms.uFogEnd, this.fogEnd);
            }
        }
    }

    lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }
}