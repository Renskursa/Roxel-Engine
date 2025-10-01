import { vec3 } from 'gl-matrix';

export class Sphere {
    constructor(center, radius) {
        this.center = center || vec3.create();
        this.radius = radius || 0;
    }

    intersects(other) {
        if (other instanceof Sphere) {
            const distance = vec3.distance(this.center, other.center);
            return distance <= this.radius + other.radius;
        }
        // Other shape intersection tests can be added here
        return false;
    }
}