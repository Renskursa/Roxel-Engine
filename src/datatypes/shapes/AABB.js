import { vec3 } from 'gl-matrix';

export class AABB {
    constructor(min, max) {
        this.min = min || vec3.create();
        this.max = max || vec3.create();
    }

    intersects(other) {
        if (other instanceof AABB) {
            return (
                this.min[0] <= other.max[0] &&
                this.max[0] >= other.min[0] &&
                this.min[1] <= other.max[1] &&
                this.max[1] >= other.min[1] &&
                this.min[2] <= other.max[2] &&
                this.max[2] >= other.min[2]
            );
        }
        // Other shape intersection tests can be added here
        return false;
    }
}