export class Color {
    constructor(r = 1, g = 1, b = 1, a = 1) {
        this.values = new Float32Array([
            Math.min(1, Math.max(0, r)),
            Math.min(1, Math.max(0, g)),
            Math.min(1, Math.max(0, b)),
            Math.min(1, Math.max(0, a))
        ]);
    }

    static fromArray(arr) {
        if (!arr || !Array.isArray(arr)) {
            console.warn('Invalid array passed to Color.fromArray:', arr);
            return new Color(1, 1, 1, 1); // Default white color
        }
        return new Color(
            arr[0] ?? 1,
            arr[1] ?? 1,
            arr[2] ?? 1,
            arr[3] ?? 1
        );
    }

    static fromRGB(r, g, b, a = 255) {
        return new Color(
            r / 255,
            g / 255,
            b / 255,
            a / 255
        );
    }

    static fromHex(hex) {
        hex = hex.replace(/^#/, '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255;
        return Color.fromRGB(r, g, b, a);
    }

    toArray() {
        return Array.from(this.values);
    }

    toRGB() {
        return {
            r: Math.round(this.values[0] * 255),
            g: Math.round(this.values[1] * 255),
            b: Math.round(this.values[2] * 255),
            a: Math.round(this.values[3] * 255)
        };
    }

    toHex() {
        const rgb = this.toRGB();
        const hex = [rgb.r, rgb.g, rgb.b, rgb.a]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
        return `#${hex}`;
    }

    [Symbol.iterator]() {
        return this.values[Symbol.iterator]();
    }

    get r() { return this.values[0]; }
    get g() { return this.values[1]; }
    get b() { return this.values[2]; }
    get a() { return this.values[3]; }

    set r(v) { this.values[0] = Math.min(1, Math.max(0, v)); }
    set g(v) { this.values[1] = Math.min(1, Math.max(0, v)); }
    set b(v) { this.values[2] = Math.min(1, Math.max(0, v)); }
    set a(v) { this.values[3] = Math.min(1, Math.max(0, v)); }
}
