import { Roxel, Noise, vec3 } from '../dist/roxel-engine.esm.js';

// Create a new engine instance, attaching it to the canvas with id 'roxel-canvas'
const engine = new Roxel('roxel-canvas');

// --- World Setup ---
const world = engine.activeScene.world;
const noise = new Noise(Math.random());

world.generate = function(x, y, z) {
    const height = Math.floor(noise.perlin2(x / 50, z / 50) * 15);
    if (y < height) return 1;
    if (y === height) return 2;
    return 0;
};

// --- Engine and Camera Setup ---
console.log('[Example basic] Simplified test case active');
engine.setChunkLoadDistance(4);
engine.renderer.config.disableCulling = false;

// Manually set the camera's initial position and look-at target
engine.camera.setPosition(8, 20, 8);
engine.camera.lookAt(8, 0, 8);

// Start the engine's game loop
engine.start();
console.log('[Example basic] Engine started');