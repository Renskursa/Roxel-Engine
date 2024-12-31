/**
 * Represents a 3D vector with x, y, and z components
 */
export class Vector3 {
    /**
     * @param {number} x - X component of the vector
     * @param {number} y - Y component of the vector
     * @param {number} z - Z component of the vector
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
        }
        return this;
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    static add(a, b) {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    static subtract(a, b) {
        return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    static multiply(a, scalar) {
        return new Vector3(a.x * scalar, a.y * scalar, a.z * scalar);
    }

    static cross(a, b) {
        return new Vector3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static fromArray(array) {
        return new Vector3(array[0], array[1], array[2]);
    }

    static toArray(vector) {
        return [vector.x, vector.y, vector.z];
    }
}
