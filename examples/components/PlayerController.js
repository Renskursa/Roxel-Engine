import { Component, Vector3, CameraControlMode, PhysicsComponent, vec3 } from '../../dist/roxel-engine.esm.js';

export class PlayerController extends Component {
    constructor() {
        super();
        this.camera = null;
        this.input = null;
        this.world = null;
        this.physicsComponent = null;
    }

    start() {
        this.camera = this.gameObject.engine.camera;
        this.camera.setControlMode(CameraControlMode.FREE);
        this.input = this.gameObject.engine.getInput();
        this.world = this.gameObject.engine.activeScene.world;
        this.physicsComponent = this.gameObject.getComponent(PhysicsComponent);
    }

    update(deltaTime) {
        // Mouse look
        const sensitivity = 0.005;
        if (document.pointerLockElement === this.gameObject.engine.canvas) {
            const mouseMotion = this.input.getMouseMotion();
            this.camera.rotate(mouseMotion.x * sensitivity, mouseMotion.y * sensitivity);
        }

        // Block placement/breaking
        if (document.pointerLockElement === this.gameObject.engine.canvas) {
            const hit = this.raycast(this.camera.position, this.camera.getForwardVector(), 10);

            if (hit) {
                // Left-click to break
                if (this.input.getKeyDown('MouseButton0')) {
                    this.world.setVoxel(hit.position.x, hit.position.y, hit.position.z, 0);
                }
                // Right-click to place
                if (this.input.getKeyDown('MouseButton2')) {
                    const placePos = hit.position.clone().add(hit.normal);
                    this.world.setVoxel(placePos.x, placePos.y, placePos.z, 4);
                }
            }
        }

        const moveSpeed = 5;
        const moveDirection = vec3.create();

        // Movement
        if (this.input.getKey('KeyW')) {
            const forward = this.camera.getForwardVectorGLM();
            vec3.add(moveDirection, moveDirection, forward);
        }
        if (this.input.getKey('KeyS')) {
            const forward = this.camera.getForwardVectorGLM();
            vec3.subtract(moveDirection, moveDirection, forward);
        }
        if (this.input.getKey('KeyA')) {
            const right = this.camera.getRightVectorGLM();
            vec3.subtract(moveDirection, moveDirection, right);
        }
        if (this.input.getKey('KeyD')) {
            const right = this.camera.getRightVectorGLM();
            vec3.add(moveDirection, moveDirection, right);
        }

        vec3.normalize(moveDirection, moveDirection);
        vec3.scale(this.physicsComponent.velocity, moveDirection, moveSpeed);

        if (this.input.getKey('Space')) {
            this.physicsComponent.velocity[1] = moveSpeed;
        }
    }

    lateUpdate() {
        this.camera.setPosition(this.gameObject.position[0], this.gameObject.position[1], this.gameObject.position[2]);
    }

    raycast(start, direction, maxDistance) {
        const step = direction.clone().normalize().multiplyScalar(0.1);
        let currentPos = start.clone();

        for (let i = 0; i < maxDistance * 10; i++) {
            const lastPos = currentPos.clone();
            currentPos.add(step);

            const x = Math.floor(currentPos.x);
            const y = Math.floor(currentPos.y);
            const z = Math.floor(currentPos.z);

            if (this.world.getVoxel(x, y, z) > 0) {
                // Hit a solid voxel. Now determine the normal.
                const voxelCenter = new Vector3(x + 0.5, y + 0.5, z + 0.5);
                const pointOfEntry = lastPos; // Approximate point of entry

                const diff = pointOfEntry.clone().subtract(voxelCenter);
                const absDiff = new Vector3(Math.abs(diff.x), Math.abs(diff.y), Math.abs(diff.z));

                let normal = new Vector3(0, 0, 0);
                if (absDiff.x > absDiff.y && absDiff.x > absDiff.z) {
                    normal.x = Math.sign(diff.x);
                } else if (absDiff.y > absDiff.z) {
                    normal.y = Math.sign(diff.y);
                } else {
                    normal.z = Math.sign(diff.z);
                }

                return {
                    position: new Vector3(x, y, z),
                    normal: normal
                };
            }
        }
        return null;
    }
}