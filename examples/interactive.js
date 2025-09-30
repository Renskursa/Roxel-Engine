import { Roxel, Noise, GameObject } from '../dist/roxel-engine.esm.js';
import { PlayerController } from './components/PlayerController.js';

// --- Engine and World Setup ---

const engine = new Roxel('roxel-canvas');
const noise = new Noise(Math.random());

// Custom world generation for more interesting terrain
engine.activeScene.world.generate = (x, y, z) => {
    const height = Math.floor(noise.noise2D(x / 50, z / 50) * 10);
    if (y < height) {
        if (y === height - 1) return 2; // Grass on top
        if (y > height - 5) return 3; // Dirt below grass
        return 1; // Stone underneath
    }
    return 0;
};

engine.activeScene.world.noise = noise;

// --- Player Setup ---
const player = engine.createGameObject();
player.addComponent(new PlayerController());
engine.addGameObject(player);


engine.start();
engine.enableFocusManager(); // Enable pointer lock on click