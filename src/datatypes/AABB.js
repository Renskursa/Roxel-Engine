export class AABB {
    constructor(min = { x: 0, y: 0, z: 0 }, max = { x: 0, y: 0, z: 0 }) {
        this.min = min;
        this.max = max;
    }

    static fromPositionAndSize(position, size) {
        const halfSize = { 
            x: size.x / 2, 
            y: size.y / 2, 
            z: size.z / 2 
        };
        
        return new AABB(
            {
                x: position.x - halfSize.x,
                y: position.y - halfSize.y,
                z: position.z - halfSize.z
            },
            {
                x: position.x + halfSize.x,
                y: position.y + halfSize.y,
                z: position.z + halfSize.z
            }
        );
    }

    intersects(other) {
        return (this.min.x <= other.max.x && this.max.x >= other.min.x) &&
               (this.min.y <= other.max.y && this.max.y >= other.min.y) &&
               (this.min.z <= other.max.z && this.max.z >= other.min.z);
    }

    containsPoint(point) {
        return point.x >= this.min.x && point.x <= this.max.x &&
               point.y >= this.min.y && point.y <= this.max.y &&
               point.z >= this.min.z && point.z <= this.max.z;
    }

    getCenter() {
        return {
            x: (this.min.x + this.max.x) / 2,
            y: (this.min.y + this.max.y) / 2,
            z: (this.min.z + this.max.z) / 2
        };
    }

    getSize() {
        return {
            x: this.max.x - this.min.x,
            y: this.max.y - this.min.y,
            z: this.max.z - this.min.z
        };
    }

    expand(amount) {
        this.min.x -= amount;
        this.min.y -= amount;
        this.min.z -= amount;
        this.max.x += amount;
        this.max.y += amount;
        this.max.z += amount;
        return this;
    }

    translate(vec) {
        this.min.x += vec.x;
        this.min.y += vec.y;
        this.min.z += vec.z;
        this.max.x += vec.x;
        this.max.y += vec.y;
        this.max.z += vec.z;
        return this;
    }

    clone() {
        return new AABB(
            { ...this.min },
            { ...this.max }
        );
    }
}
