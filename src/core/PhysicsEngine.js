import { vec3 } from 'gl-matrix';
import { CollisionSystem } from './CollisionSystem.js';

export class PhysicsEngine {
    constructor(options = {}) {
        this.enabled = options.enabled || false;
        this.gravity = options.gravity || vec3.fromValues(0, -9.8, 0);
        this.entities = [];
        this.collisionSystem = new CollisionSystem();
    }

    addEntity(entity) {
        if (this.enabled) {
            this.entities.push(entity);
            const colliderComponent = entity.getComponent('ColliderComponent');
            if (colliderComponent) {
                this.collisionSystem.addCollider(colliderComponent);
            }
        }
    }

    removeEntity(entity) {
        if (this.enabled) {
            const index = this.entities.indexOf(entity);
            if (index > -1) {
                this.entities.splice(index, 1);
            }
            const colliderComponent = entity.getComponent('ColliderComponent');
            if (colliderComponent) {
                this.collisionSystem.removeCollider(colliderComponent);
            }
        }
    }

    update(deltaTime) {
        if (!this.enabled) {
            return;
        }

        for (const entity of this.entities) {
            const physicsComponent = entity.getComponent('PhysicsComponent');
            if (physicsComponent) {
                // Apply gravity
                vec3.scaleAndAdd(physicsComponent.velocity, physicsComponent.velocity, this.gravity, deltaTime);

                // Update position
                vec3.scaleAndAdd(entity.position, entity.position, physicsComponent.velocity, deltaTime);
            }
        }

        // Handle collisions
        this.handleCollisions();
    }

    handleCollisions() {
        this.collisionSystem.checkCollisions();
    }
}