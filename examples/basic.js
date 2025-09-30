import { Roxel } from '../dist/roxel-engine.esm.js';

// Create a new engine instance, attaching it to the canvas with id 'roxel-canvas'
const engine = new Roxel('roxel-canvas');

// Start the engine's game loop
engine.start();

// Optional: Add some basic camera controls for demonstration
const camera = engine.camera;
const input = engine.getInput();

engine.addGameObject({
    update: (deltaTime) => {
        const moveSpeed = 5 * deltaTime;
        const rotateSpeed = 2 * deltaTime;

        // Basic movement
        if (input.getKey('KeyW')) {
            const forward = camera.getForwardVector();
            camera.position.add(forward.multiplyScalar(moveSpeed));
        }
        if (input.getKey('KeyS')) {
            const forward = camera.getForwardVector();
            camera.position.subtract(forward.multiplyScalar(moveSpeed));
        }
        if (input.getKey('KeyA')) {
            const right = camera.getRightVector();
            camera.position.subtract(right.multiplyScalar(moveSpeed));
        }
        if (input.getKey('KeyD')) {
            const right = camera.getRightVector();
            camera.position.add(right.multiplyScalar(moveSpeed));
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