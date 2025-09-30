export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copy(other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    multiply(scalar) {
        // Ensure scalar is a valid number and not too small
        if (typeof scalar !== 'number' || isNaN(scalar)) {
            console.warn('Invalid scalar in Vector3.multiply:', scalar);
            return this;
        }
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    multiplyScalar(scalar) {
        return this.multiply(scalar);
    }

    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
            this.z /= scalar;
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    rotateAroundY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x;
        const z = this.z;
        
        this.x = x * cos - z * sin;
        this.z = x * sin + z * cos;
        
        return this;
    }

    rotateAroundX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const y = this.y;
        const z = this.z;
        
        this.y = y * cos - z * sin;
        this.z = y * sin + z * cos;
        
        return this;
    }

    // Static methods that return new vectors
    static add(a, b) {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    static subtract(a, b) {
        return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    static multiply(v, scalar) {
        // Ensure scalar is a valid number and not too small
        if (typeof scalar !== 'number' || isNaN(scalar)) {
            console.warn('Invalid scalar in Vector3.multiply:', scalar);
            return new Vector3();
        }
        return new Vector3(v.x * scalar, v.y * scalar, v.z * scalar);
    }

    static divide(v, scalar) {
        if (scalar === 0) return new Vector3();
        return new Vector3(v.x / scalar, v.y / scalar, v.z / scalar);
    }

    static cross(a, b, out = null) {
        const result = out || new Vector3();
        result.set(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
        return result;
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static normalize(v) {
        const len = v.length();
        if (len === 0) return new Vector3();
        return new Vector3(v.x / len, v.y / len, v.z / len);
    }

    static lerp(a, b, t) {
        t = Math.max(0, Math.min(1, t));
        return new Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }

    equals(v, tolerance = 0.0001) {

        return Math.abs(this.x - v.x) <= tolerance &&
               Math.abs(this.y - v.y) <= tolerance &&
               Math.abs(this.z - v.z) <= tolerance;
    }

    toString() {
        return `Vector3(${this.x}, ${this.y}, ${this.z})`;
    }
}
