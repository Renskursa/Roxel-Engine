import { Roxel, Vector3 } from '../dist/roxel-engine.esm.js';

// Create a new engine instance, attaching it to the canvas with id 'roxel-canvas'
const engine = new Roxel('roxel-canvas');

// Start the engine's game loop
engine.start();

// Optional: Add some basic camera controls for demonstration
const camera = engine.camera;
const input = engine.getInput();

// Pre-allocate vectors to avoid memory leaks
const forward = new Vector3();
const right = new Vector3();
const movement = new Vector3();

engine.addGameObject({
    update: (deltaTime) => {
        const moveSpeed = 5 * deltaTime;
        const rotateSpeed = 2 * deltaTime;

        // Basic movement - reuse vectors to prevent memory leaks
        if (input.getKey('KeyW')) {
            camera.getForwardVector(forward);
            movement.copy(forward).multiplyScalar(moveSpeed);
            camera.position.add(movement);
        }
        if (input.getKey('KeyS')) {
            camera.getForwardVector(forward);
            movement.copy(forward).multiplyScalar(-moveSpeed);
            camera.position.add(movement);
        }
        if (input.getKey('KeyA')) {
            camera.getRightVector(right);
            movement.copy(right).multiplyScalar(-moveSpeed);
            camera.position.add(movement);
        }
        if (input.getKey('KeyD')) {
            camera.getRightVector(right);
            movement.copy(right).multiplyScalar(moveSpeed);
            camera.position.add(movement);
        }
        if (input.getKey('Space')) {
            camera.position.y += moveSpeed;
        }
        if (input.getKey('ShiftLeft')) {
            camera.position.y -= moveSpeed;
        }

        // Basic rotation
        if (input.getKey('ArrowLeft')) {
            camera.rotate(rotateSpeed, 0);
        }
        if (input.getKey('ArrowRight')) {
            camera.rotate(-rotateSpeed, 0);
        }
        if (input.getKey('ArrowUp')) {
            camera.rotate(0, rotateSpeed);
        }
        if (input.getKey('ArrowDown')) {
            camera.rotate(0, -rotateSpeed);
        }
    }
});