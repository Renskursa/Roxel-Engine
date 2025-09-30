import { Roxel } from '../dist/roxel-engine.esm.js';
import { PlayerController } from './components/PlayerController.js';

// Create a new engine instance, attaching it to the canvas with id 'roxel-canvas'
const engine = new Roxel('roxel-canvas');

// Start the engine's game loop
engine.start();

// Create a player game object with the PlayerController component
const player = engine.createGameObject();
player.addComponent(new PlayerController());