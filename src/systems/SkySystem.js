export class SkySystem {
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
        const skyHeight = 100; // Height where sky color is fully visible
        const voidHeight = -50; // Height where void color is fully visible
        
        if (height > skyHeight) {
            return this.skyColor;
        } else if (height < voidHeight) {
            return this.voidColor;
        } else {
            // Interpolate between colors
            const t = (height - voidHeight) / (skyHeight - voidHeight);
            return {
                r: this.lerp(this.voidColor.r, this.skyColor.r, t),
                g: this.lerp(this.voidColor.g, this.skyColor.g, t),
                b: this.lerp(this.voidColor.b, this.skyColor.b, t),
                a: 1.0
            };
        }
    }

    lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }
}
