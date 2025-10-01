import { AABB } from '../datatypes/shapes/AABB.js';

export class CollisionSystem {
    constructor() {
        this.colliders = [];
    }

    addCollider(collider) {
        this.colliders.push(collider);
    }

    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index > -1) {
            this.colliders.splice(index, 1);
        }
    }

    checkCollisions() {
        for (let i = 0; i < this.colliders.length; i++) {
            for (let j = i + 1; j < this.colliders.length; j++) {
                const colliderA = this.colliders[i];
                const colliderB = this.colliders[j];

                if (colliderA.shape instanceof AABB && colliderB.shape instanceof AABB) {
                    if (colliderA.shape.intersects(colliderB.shape)) {
                        // Handle collision
                        console.log('Collision detected between', colliderA.entity, 'and', colliderB.entity);
                    }
                }
            }
        }
    }
}