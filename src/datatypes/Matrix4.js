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
}