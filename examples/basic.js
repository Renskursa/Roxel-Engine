import { Roxel, Noise, vec3 } from '../dist/roxel-engine.esm.js';
import { PlayerController } from './components/PlayerController.js';

// Create a new engine instance, attaching it to the canvas with id 'roxel-canvas'
const engine = new Roxel('roxel-canvas');

console.log('[Example basic] Single-chunk plane generator active');

// Re-enable culling for performance
engine.renderer.config.disableCulling = false;

// Start the engine's game loop
engine.start();
console.log('[Example basic] Engine started');

// Create a player game object with the PlayerController component
const player = engine.createGameObject();
player.addComponent(new PlayerController());
console.log('[Example basic] Player created', { position: Array.from(player.position) });

// Position player above terrain for initial visibility
// Place player inside the target chunk (0,0,0) above the plane
vec3.set(player.position, 8, 6, 8);
console.log('[Example basic] Player repositioned', { position: Array.from(player.position) });