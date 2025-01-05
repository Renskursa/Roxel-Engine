/**
 * Represents a 4x4 transformation matrix
 */
export class Matrix4 {
    /**
     * Creates a new 4x4 identity matrix
     */
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    identity() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return this;
    }

    perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        this.elements[0] = f / aspect;
        this.elements[5] = f;
        this.elements[10] = (far + near) / (near - far);
        this.elements[11] = -1;
        this.elements[14] = (2 * far * near) / (near - far);
        this.elements[15] = 0;
        return this;
    }

    translate(x, y, z) {
        const m = new Matrix4();
        m.elements[12] = x;
        m.elements[13] = y;
        m.elements[14] = z;
        return this.multiply(m);
    }

    scale(x, y, z) {
        const m = new Matrix4();
        m.elements[0] = x;
        m.elements[5] = y;
        m.elements[10] = z;
        return this.multiply(m);
    }

    static multiply(a, b) {
        const result = new Matrix4();
        const ae = a.elements;
        const be = b.elements;
        const te = result.elements;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                te[i * 4 + j] = 
                    be[i * 4 + 0] * ae[0 * 4 + j] +
                    be[i * 4 + 1] * ae[1 * 4 + j] +
                    be[i * 4 + 2] * ae[2 * 4 + j] +
                    be[i * 4 + 3] * ae[3 * 4 + j];
            }
        }

        return result;
    }

    multiply(other) {
        const result = Matrix4.multiply(this, other);
        this.elements = result.elements;
        return this;
    }

    rotateX(angle) {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        m.elements[5] = c;
        m.elements[6] = s;
        m.elements[9] = -s;
        m.elements[10] = c;
        
        return this.multiply(m);
    }

    rotateY(angle) {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        m.elements[0] = c;
        m.elements[2] = -s;
        m.elements[8] = s;
        m.elements[10] = c;
        
        return this.multiply(m);
    }

    rotateZ(angle) {
        const m = new Matrix4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        m.elements[0] = c;
        m.elements[1] = s;
        m.elements[4] = -s;
        m.elements[5] = c;
        
        return this.multiply(m);
    }

    ortho(left, right, bottom, top, near, far) {
        const rl = 1 / (right - left);
        const tb = 1 / (top - bottom);
        const fn = 1 / (far - near);

        this.elements = new Float32Array([
            2 * rl, 0, 0, 0,
            0, 2 * tb, 0, 0,
            0, 0, -2 * fn, 0,
            -(right + left) * rl, -(top + bottom) * tb, -(far + near) * fn, 1
        ]);

        return this;
    }

    lookAt(eye, target, up) {
        const z = this.normalize(this.subtract(eye, target));
        const x = this.normalize(this.cross(up, z));
        const y = this.cross(z, x);

        this.elements = new Float32Array([
            x.x, y.x, z.x, 0,
            x.y, y.y, z.y, 0,
            x.z, y.z, z.z, 0,
            -this.dot(x, eye), -this.dot(y, eye), -this.dot(z, eye), 1
        ]);

        return this;
    }

    normalize(v) {
        const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return { x: v.x / len, y: v.y / len, z: v.z / len };
    }

    subtract(a, b) {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    }

    cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }

    dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    copy(other) {
        this.elements = new Float32Array(other.elements);
        return this;
    }
}