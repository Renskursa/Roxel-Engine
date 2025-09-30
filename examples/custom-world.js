import { Roxel, Noise } from '../dist/roxel-engine.esm.js';

// Create a new engine instance
const engine = new Roxel('roxel-canvas');

// Create a noise generator for the world
const noise = new Noise(Math.random());

// Define a custom world generation function
const generate = (x, y, z) => {
    const height = Math.floor(noise.noise2D(x / 50, z / 50) * 10);
    if (y < height) {
        return 1; // Return 1 to place a voxel
    }
    return 0; // Return 0 for empty space
};

// Set the custom generator on the world object
engine.activeScene.world.generate = generate;

// Start the engine
engine.start();

// Add camera controls for navigation
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